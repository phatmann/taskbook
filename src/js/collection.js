/*global subclass Event */

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

function Grouping(property) {
  Grouping.baseConstructor.call(this, property);
  Event.map(this, ['groupChanged', 'groupAdded', 'groupRemoved']);
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
    this.event.groupChanged.notify(this.propertyKey(obj));
  },
  
  // TODO: test group removal
  
  remove: function(obj) {
    var key = this.propertyKey(obj);
    var group = this.entries[key];
      
    if (group) {
      var n = group.indexOf(obj);
  
      if (n != -1) {
        group.splice(n, 1);
        
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

function Collection(props) {
  if (!props) {
    props = {};
  }
  
  this.items          = props.items || [];
  this.collectionID   = props.collectionID || "default";
  this.idIndex        = new Index('itemID');
  this.groupings      = {};
  this.meta           = {};
  
  Event.map(this, ['itemAdded', 'itemRemoved', 'itemChanged', 'metadataChanged']);

  if (!this.nextItemID) {
     if (this.items && this.items.length > 0) {
       this.nextItemID  = this.items[this.items.length - 1].itemID + 1;
     } else {
       this.nextItemID = 1;
     }
  }

  if (props.groupings) {
    for (var i= 0; i < props.groupings.length; ++i) {
      var grouping = props.groupings[i];
      this.groupings[grouping] = new Grouping(grouping);
    }
  }
}

Collection.prototype = {
  save: function() {
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
  
  setMetadata: function(props) {
    $.extend(this.meta, props);
    this.event.metadataChanged.notify();
  },
  
  add: function(item, suppressNotify) {
    item.collection   = this;
    item.itemID       = this.nextItemID++;
    
    this.items.push(item);
    this.idIndex.add(item);
    
    for (var grouping in this.groupings) {
      this.groupings[grouping].add(item);
    }
    
    if (!suppressNotify) { 
      this.event.itemAdded.notify(item);
    }
  },
  
  remove: function(item, suppressNotify) {
    this.items.splice(this.items.indexOf(item), 1);
    this.idIndex.remove(item);
    
    for (var grouping in this.groupings) {
      this.groupings[grouping].remove(item);
    }
    
    item.collection = null;
    
    if (!suppressNotify) { 
      this.event.itemRemoved.notify(item);
    }
  },

  get: function(id) {
    return this.idIndex.get(id);
  },
  
  all: function() {
    return this.items;
  },
  
  group: function(property, value) {
    return this.groupings[property].get(value);
  },
  
  groups: function(property) {
    if (this.groupings) {
      var grouping =  this.groupings[property];
      
      if (grouping) {
        return grouping.groups();
      }
    }
      
    return [];
  },
  
  beforeItemChanged: function(item, property) {
    var grouping = this.groupings[property];
    
    if (grouping) {
      grouping.remove(item);
    }
  },
  
  itemChanged: function(item, property) {
    this.save();
    
    var grouping = this.groupings[property];
    
    if (grouping) {
      grouping.add(item);
    }
    
    this.event.itemChanged.notify(item);
  }
};

Collection.Item = function(itemType, attrs) {
  this.collection = null;
  this.itemType   = itemType;
  this.itemID     = attrs ? attrs.itemID : null;
};

Collection.Item.prototype = {
  setProperty: function(property, value) {
    this.collection.beforeItemChanged(this, property);
    this[property] = value;
    this.collection.itemChanged(this, property);
  }
};
  
