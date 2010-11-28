/*global TaskBook Task */

$(function() {
  var book;
  
  module('Book', {
    setup: function() {
      book = new TaskBook('test');
      
      var task1 = new Task({goal: 'goal1', startDate:'2010-01-01', dueDate:'2010-02-01'});
      var task2 = new Task({goal: 'goal2', startDate:'2010-01-01', dueDate:'2010-04-01'});
      var task3 = new Task({goal: 'goal3', startDate:'2010-02-01', dueDate:'2010-03-01'});
      
      book.add(task1);
      book.add(task2);
      book.add(task3);
    }
  });
  
  test('Get active dates', function() {
    expect(2);
    equal(book.activeDates().length, 4, 'Active dates');
    ok(book.activeDates().indexOf('2010-01-01') != -1, 'Active dates include first date');
  });
});