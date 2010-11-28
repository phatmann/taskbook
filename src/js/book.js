/*global Collection Task subclass */

function TaskBook(bookID) {
  TaskBook.baseConstructor.call(this, {collectionID:'taskbook_' + bookID, groupings:['startDate', 'dueDate']});
  this.currentDate  = null;
}

subclass(TaskBook, Collection);

$.extend(TaskBook.prototype, {

});
