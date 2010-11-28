/*global subclass */

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
}

subclass(Grouping, Index);

$.extend(Grouping.prototype, {
  group: function(obj, autocreate) {
    var key = this.propertyKey(obj);
    var group = this.entries[key];
    
    if (autocreate && !group) {
      group = this.entries[key] = [];
    }
    
    return group;
  },
  
  groups: Index.prototype.keys,
  
  add: function(obj) {
    this.group(obj, true).push(obj);
  },
  
  remove: function(obj) {
    var group = this.group(obj);
      
    if (group) {
      var n = group.indexOf(obj);
  
      if (n != -1) {
        group.splice(n, 1);
      }
    }
  },
  
  get: function(key) {
    // TODO: use base class get() method
    return this.entries[this.key(key)] || [];
  }
});

function Collection(props) {
  this.init(props);
}

Collection.prototype = {
  init: function(props) {
    if (!props) {
      props = {};
    }
    
    this.items          = props.items || [];
    this.collectionID   = props.collectionID || "default";
    this.idIndex        = new Index('itemID');
    this.groupings      = {};
  
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
  },
  
  load: function() {
    var storedCollection = window.localStorage['collection_' + this.collectionID];

    if (storedCollection) {
      storedCollection = JSON.parse(storedCollection, function(key, value) {
        if (value && typeof value === 'object') {
            // Revive item pseudo-classes
            var type = value.itemType;
            if (type && typeof type === 'string' && typeof window[type] === 'function') {
                var item = new window[type](value);
                item.collection = this;
                return item;
            }
        }
        return value;
      });
    }
    
    this.init(storedCollection);
  },
  
  save: function() {
    var stored_collection = JSON.stringify(this, function(key, value) {
      if (['collection', 'groupings', 'idIndex'].indexOf(key) != -1) {
        return undefined;
      } else {
        return value;
      }
    });
    
    window.localStorage['collection_' + this.collectionID] = stored_collection;
  },
  
  update: function(props) {
    $.extend(this, props);
    $(this).trigger('change', props);
  },
  
  add: function(item) {
    item.collection   = this;
    item.itemID       = this.nextItemID++;
    
    this.items.push(item);
    this.idIndex.add(item);
    
    for (var grouping in this.groupings) {
      this.groupings[grouping].add(item);
    }
    
    $(this).trigger('change', {items: this.items}); // TODO: avoid this overhead on load
  },
  
  remove: function(item) {
    this.items.splice(this.items.indexOf(item), 1);
    this.idIndex.remove(item);
    
    for (var grouping in this.groupings) {
      this.groupings[grouping].remove(item);
    }
    
    item.collection = null;
    $(this).trigger('change', {items: this.items});
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
    
    $(this).trigger('itemChange', item);
  }
};

Collection.Item = function(itemType) {
  this.collection = null;
  this.itemType   = itemType;
};

Collection.Item.prototype = {
  setProperty: function(property, value) {
    this.collection.beforeItemChanged(this, property);
    this[property] = value;
    this.collection.itemChanged(this, property);
  }
};
  
