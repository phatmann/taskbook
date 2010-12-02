/*global subclass Collection GroupedCollection */

function TestItem(props) {
  TestItem.baseConstructor.call(this, 'TestItem');
  this.name  = props.name;
  this.prop1 = props.prop1;
  this.prop2 = props.prop2;
}

subclass(TestItem, Collection.Item);

$(function() {
  var collection;
  
  module('Collection', {
    setup: function() {
      window.localStorage['collection_itemcollection_test'] = null;
      
      var item1 = new TestItem({name: 'name1', prop1:'2010-01-01', prop2:'2010-02-01'});
      var item2 = new TestItem({name: 'name2', prop1:'2010-01-01', prop2:'2010-04-01'});
      var item3 = new TestItem({name: 'name3', prop1:'2010-02-01', prop2:'2010-03-01'});
      
      collection = new GroupedCollection({collectionID:'test', groupings:['prop1', 'prop2']});
      collection.add(item1);
      collection.add(item2);
      collection.add(item3);
    }
  });
  
  test('Init blank collection', function() {
    var collection2 = new Collection();
  });
  
  test('Save collection to storage' , function() {
    expect(2);
    collection.save();
    var stored = JSON.parse(window.localStorage['collection_test']);
    equal(stored['items'].length, collection.items.length, 'Saved items');
    ok(stored['items'][0].name == collection.items[0].name, 'First item was stored correctly');
  });
  
  
  test('Load collection from storage' , function() {
  	expect(3);
  	collection.save();
  	var collection2 = new Collection({collectionID:'test'});
  	collection2.load();
  	console.log(collection2.items);
  	equal(collection2.items.length, collection.items.length, 'Items in loaded collection');
  	equal(collection2.items[0].name, collection.items[0].name, 'First item was loaded correctly');
  	ok(collection2 == collection2.items[0].collection, 'First item refers to collection');
  });
  
  test('Auto-assign item ID', function() {
    equal(2, collection.items[1].itemID, 'Second item ID should be 2');
  });
  
  test('Get item', function() {
    expect(1);
    var item = collection.items[0];
    equal(collection.get(item.itemID).itemID, item.itemID, 'ID of fetched item');
    //ok(collection == item.collection, 'Fetched item refers to collection');
  });
  
  test('Group by a property', function() {
    expect(2);
    var group = collection.group('prop1', '2010-01-01');
    equal(group.size(), 2, 'Items in group');
    ok(group.items.indexOf(collection.items[0]) != -1, 'First item is in group');
  });
  
  test('Group by a second property', function() {
    expect(2);
    var group = collection.group('prop2', '2010-04-01');
    equal(group.size(), 1, 'Items in group');
    ok(group.items.indexOf(collection.items[1]) != -1, 'Second item is in group');
  });
  
  test('Return groups', function() {
    expect(2);
    var groups = collection.groups('prop1');
    equal(2, groups.length);
    equal('2010-01-01', groups[0].itemID);
  });
  
  test('Remove item from collection and group', function() {
    expect(3);
    var item = collection.items[1];
    collection.remove(item);
    equal(2, collection.items.length, 'Items');
    ok(collection.items.indexOf(item) == -1, 'Items array does not include removed item');
    
    var group = collection.group('prop1', '2010-04-01');
    ok(!group, 'Group was deleted');
  });
  
  test('Create an item with properties', function() {
    expect(1);
    var t = new TestItem({name:'name'});
    equal('name', t.name);
  });
});