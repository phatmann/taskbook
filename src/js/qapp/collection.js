/*global subclass */

function Item(itemType, props) {
  this.itemType   = itemType;
  this.itemID     = props ? props.itemID : null;
  this.owners     = [];
}

Item.prototype = {
  setProperties: function(properties) {
    for (var i = 0; i < this.owners.length; ++i) {
      this.owners[i].beforeItemChanged(this, properties);
    }
    
    $.extend(this, properties);
    
    for (i = 0; i < this.owners.length; ++i) {
      this.owners[i].itemChanged(this, properties);
    }
  },
  
  setProperty: function(property, value) {
    this.setProperties({property: value});
  },
  
  addOwner: function(owner) {
    this.owners.push(owner);
  },
  
  removeOwner: function(owner) {
    var index = this.owners.indexOf(owner);
    
    if (index != -1) {
      this.owners.splice(index, 1);
    }
  }
};

function Collection(props) {
  Collection.baseConstructor.call(this, 'Collection', props);
  
  if (!props) {
    props = {};
  }
  
  this.items          = props.items || [];
  this.collectionID   = props.collectionID;  
}

subclass(Collection, Item);

$.extend(Collection.prototype, {
  save: function() {
    if (!this.collectionID) {
      console.log("No collection ID, cannot save");
    }
    
    var stored = {items: this.items, metadata: this._metadata};
    
    stored = JSON.stringify(stored, function(key, value) {
      if (key == 'owners') {
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
      
      this._metadata  = stored.metadata;
      this.items = [];
      
      // TODO: cache groupings?
      for (var i = 0; i < stored.items.length; ++i) {
        this.add(stored.items[i], true); 
      }
    }
  },
  
  add: function(item, suppressNotify) {
    this.items.push(item);
    item.addOwner(this);
    
    if (!suppressNotify) { 
      this.triggerEvent('itemAdded', item);
    }
  },
  
  remove: function(item, suppressNotify) {
    var index = this.items.indexOf(item);
    
    if (index === -1) {
      return false;
    }
    
    this.items.splice(index, 1);
    item.removeOwner(this);
    
    if (!suppressNotify) { 
      this.triggerEvent('itemRemoved', item);
    }
    
    return true;
  },
  
  all: function() {
    return this.items;
  },
  
  size: function() {
    return this.items.length;
  },
  
  metadata: function(props) {
    if (!this._metadata) {
      this._metadata = {};
    }
    
    if (props) {
      $.extend(this._metadata, props);
      this.triggerEvent('metadataChanged');
    }
    
    return this._metadata;
  },
  
  triggerEvent: function(event, arg) {
    $(this).triggerHandler(event, arg);
  },
  
  bindEvent: function(event, handler) {
    $(this).bind(event, handler);
  },
  
  unbindEvent: function(event) {
    $(this).unbind(event);
  },
  
  beforeItemChanged: function(item, properties) {
  },
  
  itemChanged: function(item, properties) {
  }
});

function Index(property) {
  this.entries  = {};
  this.property = property;
}

Index.key = function(prop) {
  return prop.toKey ? prop.toKey() : prop.toString();
};

Index.prototype = {
  propertyKey: function(obj) {
    return Index.key(obj[this.property]);
  },
  
  add: function(obj) {
    this.entries[this.propertyKey(obj)] = obj;
  },
  
  remove: function(obj) {
    delete this.entries[this.propertyKey(obj)];
  },
  
  get: function(prop) {
    return this.entries[Index.key(prop)];
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
  this._fetchNextID();
}

subclass(IndexedCollection, Collection);

$.extend(IndexedCollection.prototype, {
  _fetchNextID: function() {
    if (this.items && this.items.length > 0) {
     this.nextItemID  = this.items[this.items.length - 1].itemID + 1;
    } else {
     this.nextItemID = 1;
    }
  },
  
  load: function() {
    IndexedCollection.superClass.load.call(this);
    this._fetchNextID();
  },
  
  add: function(item, suppressNotify) {
    if (!item.itemID) {
      item.itemID = this.nextItemID++;
    }
    
    if (!this.get(item.itemID)) {
      IndexedCollection.superClass.add.call(this, item, suppressNotify);
      this.idIndex.add(item);
    }
  },
  
  remove: function(item, suppressNotify) {
    this.idIndex.remove(item);
    return IndexedCollection.superClass.remove.call(this, item, suppressNotify);
  },

  get: function(id) {
    return this.idIndex.get(id);
  },
  
  beforeItemChanged: function(item, properties) {
  },
  
  itemChanged: function(item, properties) {
    this.triggerEvent('itemChanged', item);
  }
});

function Grouping(property) {
  Grouping.baseConstructor.call(this);
  this.property = property;
}

subclass(Grouping, IndexedCollection);
    
$.extend(Grouping.prototype, {
  addToGroup: function(obj) {
    var key = this.propertyKey(obj);
    var group = this.get(key);
    
    if (!group) {
      group = new Collection();
      group.itemID = key;
      this.add(group);
    }
    
    group.add(obj);
    //this.event.itemChanged.notify(key);
  },
  
  removeFromGroup: function(obj) {
    var key = this.propertyKey(obj);
    var group = this.get(key);
      
    if (group) {
      var wasRemoved = group.remove(obj);
  
      if (wasRemoved) {
        //this.event.itemChanged.notify(key);
        
        if (group.size() === 0) {
          this.remove(group);
        }
      }
    }
  },
  
  propertyKey: function(obj) {
    return Index.key(obj[this.property]);
  }
});

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
      this.groupings[grouping].addToGroup(item);
    }
  },
  
  remove: function(item, suppressNotify) {
    var wasRemoved = GroupedCollection.superClass.remove.call(this, item, suppressNotify);
    
    if (wasRemoved) {
      for (var grouping in this.groupings) {
        this.groupings[grouping].removeFromGroup(item);
      }
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
      return this.grouping(property).all();
    }
      
    return null;
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

function MergedCollection(collections) {
  MergedCollection.baseConstructor.call(this);
  
  var self = this;
  
  function itemAdded(collection, item) {
    self.add(item);
  }
  
  function itemRemoved(collection, item) {
    self.remove(item);
  }
  
  for (var i = 0; i < arguments.length; ++i) {
    var collection = arguments[i];
    var items = collection.all();
    
    for (var j = 0; j < items.length; ++j) {
      this.add(items[j], true);
    }
    
    collection.bindEvent('itemAdded', itemAdded);
    collection.bindEvent('itemRemoved', itemRemoved);
  }
}

subclass(MergedCollection, IndexedCollection);
  
