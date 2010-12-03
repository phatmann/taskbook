/*global subclass Index Item Grouping */

function IndexTestItem(props) {
  IndexTestItem.baseConstructor.call(this, 'IndexTestItem', props);
  this.prop = props.prop;
}

subclass(IndexTestItem, Item);

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
  	var obj = new IndexTestItem({prop: 'x'});
  	grouping.addToGroup(obj);
  	equal(grouping.get('x').size(), 1, 'Tasks in group');
    ok(grouping.get('x').all()[0] == obj, 'Object in group');
  });

  test('Remove item from grouping' , function(){
  	expect(1);
  	var grouping = new Grouping('prop');
  	var obj1 = new IndexTestItem({prop: 'x'});
  	var obj2 = new IndexTestItem({prop: 'x'});
  	grouping.addToGroup(obj1);
  	grouping.addToGroup(obj2);
  	grouping.removeFromGroup(obj1);
    equal(1, grouping.get('x').size(), 'Item removed');
  });
  
  test('Remove last item from grouping' , function(){
  	expect(1);
  	var grouping = new Grouping('prop');
  	var obj = new IndexTestItem({prop: 'x'});
  	grouping.addToGroup(obj);
  	grouping.removeFromGroup(obj);
    equal(null, grouping.get('x'), 'Group deleted');
  });
});