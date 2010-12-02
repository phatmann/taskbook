/*globalIndex Grouping */

$(function() {
  module('Index');
  
  test('Add to index', function(){
    expect(1);
    var index = new Index('id');
    var obj = {id: 'id'};
  	index.add(obj);
  	equal(index.entries['id'], obj, 'Tasks indexed');
  });
  
  test('Remove from index', function(){
    expect(1);
    var index = new Index('id');
    var obj = {id: 1};
  	index.add(obj);
  	index.remove(obj);
  	equal(index.entries['id'], null, 'Task unindexed');
  });
  
  test('Add to grouping' , function(){
  	expect(2);
  	var grouping = new Grouping('prop');
  	var obj = {prop: 'x'};
  	grouping.add(obj);
  	equal(grouping.entries['x'].size(), 1, 'Tasks in group');
    ok(grouping.entries['x'].items[0] == obj, 'Object in group');
  });

  test('Remove item from grouping' , function(){
  	expect(1);
  	var grouping = new Grouping('prop');
  	var obj1 = {prop: 'x'};
  	var obj2 = {prop: 'x'};
  	grouping.add(obj1);
  	grouping.add(obj2);
  	grouping.remove(obj1);
    equal(1, grouping.entries['x'].size(), 'Item removed');
  });
  
  test('Remove last item from grouping' , function(){
  	expect(1);
  	var grouping = new Grouping('prop');
  	var obj = {prop: 'x'};
  	grouping.add(obj);
  	grouping.remove(obj);
    equal(null, grouping.entries['x'], 'Group deleted');
  });
});