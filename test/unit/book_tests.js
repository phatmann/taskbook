/*global TaskBook Task */

$(function() {
  var book;
  
  module('Book', {
    setup: function() {
      window.localStorage['collection_taskbook_test'] = null;
      
      var task1 = new Task({goal: 'goal1', startDate:'2010-01-01', dueDate:'2010-02-01'});
      var task2 = new Task({goal: 'goal2', startDate:'2010-01-01', dueDate:'2010-04-01'});
      var task3 = new Task({goal: 'goal2', startDate:'2010-02-01', dueDate:'2010-03-01'});
      
      book = new TaskBook('test', ['startDate', 'dueDate']);
      book.add(task1);
      book.add(task2);
      book.add(task3);
    }
  });
  
  test('Save book to storage' , function() {
    expect(2);
    book.save();
    var stored = JSON.parse(window.localStorage['collection_taskbook_test']);
    equal(stored['items'].length, book.items.length, 'Saved tasks');
    ok(stored['items'][0].goal == book.items[0].goal, 'First task was stored correctly');
  });
  
  
  test('Load book from storage' , function() {
  	expect(2);
  	book.save();
  	var book2 = new TaskBook('test');
  	book2.load();
  	equal(book2.items.length, book.items.length, 'Tasks in book2');
  	ok(book.items[0].goal == book2.items[0].goal, 'First task was loaded correctly');
  });
  
  test('Get task', function() {
    expect(1);
    var task = book.items[0];
    equal(book.get(task.itemID).itemID, task.itemID, 'ID of fetched task');
  });
  
  test('Grouped by startDate', function() {
    expect(2);
    var group = book.group('startDate', '2010-01-01');
    equal(group.length, 2, 'Tasks in group');
    ok(group.indexOf(book.items[0]) != -1, 'First task is in group');
  });
  
  test('Grouped by dueDate', function() {
    expect(2);
    var group = book.group('dueDate', '2010-04-01');
    equal(group.length, 1, 'Tasks in group');
    ok(group.indexOf(book.items[1]) != -1, 'Second task is in group');
  });
  
  // test('Active dates', function() {
  //   expect(2);
  //   equal(book.activeDates().length, 4, 'Active dates');
  //   ok(book.activeDates().indexOf('2010-01-01') != -1, 'Active dates include first date');
  // });
});