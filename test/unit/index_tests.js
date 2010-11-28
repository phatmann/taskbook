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
  	equal(grouping.entries['x'].length, 1, 'Tasks in group');
    ok(grouping.entries['x'][0] == obj, 'Object in group');
  });

  test('Remove from grouping' , function(){
  	expect(1);
  	var grouping = new Grouping('prop');
  	var obj = {prop: 'x'};
  	grouping.add(obj);
  	grouping.remove(obj);
    equal(grouping.entries['x'].length, 0, 'Tasks in group');
  });
});