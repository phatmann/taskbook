/*global TaskBook Task */

$(function() {
  var book;
  
  module('Book', {
    setup: function() {
      book = new TaskBook('test');
    }
  });
  
  test('Should add task', function() {
    book.add(new Task('goal'));
    equal(1, book.all().length);
  });
  
  // test('Active dates', function() {
  //   expect(2);
  //   equal(book.activeDates().length, 4, 'Active dates');
  //   ok(book.activeDates().indexOf('2010-01-01') != -1, 'Active dates include first date');
  // });
});