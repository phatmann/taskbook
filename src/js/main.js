/*global TaskBook TasksView TasksController */

$(function(){
  var book = new TaskBook('default', ['startDate', 'dueDate']);
  book.load();
  
  var controller = new TasksController(book);
  
  var view = new TasksView(controller);
  view.render();
});


