/*global subclass Event */

function Collection(props) {
  if (!props) {
    props = {};
  }
  
  this.items          = props.items || [];
  this.collectionID   = props.collectionID;
  this.meta           = {};
  
  
}

Collection.prototype = {
  save: function() {
    if (!this.collectionID) {
      console.log("No collection ID, cannot save");
    }
    
    var stored = {items: this.items, meta: this.meta};
    
    stored = JSON.stringify(stored, function(key, value) {
      if (key == 'collection') {
        return undefined;
      } else {
        return value;
      }
    });
    
    window.localStorage['collection_' + this.collectionID] = stored;
  },
  
  load: function() {
    if (!this.collectionID) {
      console.log("No collection ID, cannot load");
    }
    
    var stored = window.localStorage['collection_' + this.collectionID];
    
    if (stored) {
      var self = this;
      stored = JSON.parse(stored, function(key, value) {
        if (value && typeof value === 'object' && value.itemType) {
            // Revive item classes
            var item = new window[value.itemType](value);
            item.collection = self;
            return item;
        }
        return value;
      });
      
      this.meta  = stored.meta || {};
      this.items = [];
      
      // TODO: cache groupings?
      for (var i = 0; i < stored.items.length; ++i) {
        this.add(stored.items[i], true); 
      }
    }
  },
  
  add: function(item, suppressNotify) {
    this.items.push(item);
    
    if (!suppressNotify) { 
      this.event.itemAdded.notify(item);
    }
  },
  
  remove: function(item, suppressNotify) {
    this.items.splice(this.items.indexOf(item), 1);
    
    if (!suppressNotify) { 
      this.event.itemRemoved.notify(item);
    }
  },
  
  setMetadata: function(props) {
    $.extend(this.meta, props);
    this.event.metadataChanged.notify();
  }
};

Event.map(Collection.prototype, ['itemAdded', 'itemRemoved', 'metadataChanged']);

function Index(property) {
  this.entries  = {};
  this.property = property;
}

Index.prototype = {
  key: function(prop) {
    return prop.toKey ? prop.toKey() : prop.toString();
  },
  
  propertyKey: function(obj) {
    var prop = obj[this.property];
    return this.key(prop);
  },
  
  add: function(obj) {
    this.entries[this.propertyKey(obj)] = obj;
  },
  
  remove: function(obj) {
    delete this.entries[this.propertyKey(obj)];
  },
  
  get: function(key) {
    return this.entries[this.key(key)];
  },
  
  keys: function() {
    var keys = [];
    for (var key in this.entries) {
      keys.push(key);
    }
    return keys;
  }
};

function IndexedCollection(props) {
  IndexedCollection.baseConstructor.call(this, props); 
  this.idIndex = new Index('itemID');

  if (!this.nextItemID) {
     if (this.items && this.items.length > 0) {
       this.nextItemID  = this.items[this.items.length - 1].itemID + 1;
     } else {
       this.nextItemID = 1;
     }
  }
}

subclass(IndexedCollection, Collection);

$.extend(IndexedCollection.prototype, {
  add: function(item, suppressNotify) {
    item.collection   = this;
    item.itemID       = this.nextItemID++;
    Collection.prototype.add.call(this, item, suppressNotify);
    this.idIndex.add(item);
  },
  
  remove: function(item, suppressNotify) {
    this.idIndex.remove(item);
    item.collection = null;
    Collection.prototype.remove.call(this, item, suppressNotify);
  },

  get: function(id) {
    return this.idIndex.get(id);
  },
  
  all: function() {
    return this.items;
  },
  
  beforeItemChanged: function(item, properties) {
  },
  
  itemChanged: function(item, properties) {
    this.save();
    this.event.itemChanged.notify(item);
  }
});

Event.map(IndexedCollection.prototype, ['itemChanged']);

function Grouping(property) {
  Grouping.baseConstructor.call(this, property);
}

subclass(Grouping, Index);

// TODO: use base class methods to modify entries array
    
$.extend(Grouping.prototype, {
  group: function(obj) {
    var key = this.propertyKey(obj);
    var group = this.entries[key];
    
    if (!group) {
      group = this.entries[key] = [];
      this.event.groupAdded.notify(key);
    }
    
    return group;
  },
  
  groups: Index.prototype.keys,
  
  add: function(obj) {
    this.group(obj).push(obj);
    this.event.groupChanged.notify(obj[this.property]);
  },
  
  remove: function(obj) {
    var key = this.propertyKey(obj);
    var group = this.entries[key];
      
    if (group) {
      var n = group.indexOf(obj);
  
      if (n != -1) {
        group.splice(n, 1);
        this.event.groupChanged.notify(key);
        
        if (group.length === 0) {
          delete this.entries[key];
          this.event.groupRemoved.notify(key);
        }
      }
    }
  },
  
  get: function(key) {
    return this.entries[this.key(key)] || [];
  }
});

Event.map(Grouping.prototype, ['groupChanged', 'groupAdded', 'groupRemoved']);

function GroupedCollection(props) {
  GroupedCollection.baseConstructor.call(this, props);
  
  this.groupings = {};
    
  if (props.groupings) {
    for (var i= 0; i < props.groupings.length; ++i) {
      var grouping = props.groupings[i];
      this.groupings[grouping] = new Grouping(grouping);
    }
  }
}

subclass(GroupedCollection, IndexedCollection);

$.extend(GroupedCollection.prototype, {
  add: function(item, suppressNotify) {
    GroupedCollection.superClass.add.call(this, item, suppressNotify);
    
    for (var grouping in this.groupings) {
      this.groupings[grouping].add(item);
    }
  },
  
  remove: function(item, suppressNotify) {
    GroupedCollection.superClass.remove.call(this, item, suppressNotify);

    for (var grouping in this.groupings) {
      this.groupings[grouping].remove(item);
    }
  },
  
  grouping: function(property) {
    return this.groupings[property];
  },
  
  group: function(property, value) {
    return this.grouping(property).get(value);
  },
  
  groups: function(property) {
    if (this.grouping(property)) {
      return this.grouping(property).groups();
    }
      
    return [];
  },
  
  beforeItemChanged: function(item, properties) {
    GroupedCollection.superClass.beforeItemChanged.call(this, item, properties);
    
    for (var property in properties) {
      var grouping = this.groupings[property];
    
      if (grouping) {
        grouping.remove(item);
      }
    }
  },
  
  itemChanged: function(item, properties) {
    GroupedCollection.superClass.itemChanged.call(this, item, properties);

    for (var property in properties) {
      var grouping = this.groupings[property];
    
      if (grouping) {
        grouping.add(item);
      }
    }
  }
});

Collection.Item = function(itemType, attrs) {
  this.collection = null;
  this.itemType   = itemType;
  this.itemID     = attrs ? attrs.itemID : null;
};

Collection.Item.prototype = {
  setProperties: function(properties) {
    this.collection.beforeItemChanged(this, properties);
    $.extend(this, properties);
    this.collection.itemChanged(this, properties);
  },
  
  setProperty: function(property, value) {
    this.setProperties({property: value});
  }
};
  
