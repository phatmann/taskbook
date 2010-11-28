/*global TaskBook Task */

$(function() {
  var book;
  
  module('Book', {
    setup: function() {
      book = new TaskBook('test');
    }
  });
  
  test('Can create TaskBook', function() {
  });
  
  // test('Active dates', function() {
  //   expect(2);
  //   equal(book.activeDates().length, 4, 'Active dates');
  //   ok(book.activeDates().indexOf('2010-01-01') != -1, 'Active dates include first date');
  // });
});