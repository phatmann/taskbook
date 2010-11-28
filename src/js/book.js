/*global Collection Task subclass */

function TaskBook(bookID, groupings) {
  TaskBook.baseConstructor.call(this, {collectionID:'taskbook_' + bookID, groupings:groupings});
  this.currentDate  = null;
}

subclass(TaskBook, Collection);

$.extend(TaskBook.prototype, {

});
