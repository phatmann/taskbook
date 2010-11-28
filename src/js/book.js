/*global Collection Task subclass */

function TaskBook(bookID) {
  TaskBook.baseConstructor.call(this, {collectionID:'taskbook_' + bookID, groupings:['startDate', 'dueDate']});
  this.meta.currentDate  = null;
}

subclass(TaskBook, Collection);

$.extend(TaskBook.prototype, {
  currentDate: function(date) {
    if (date) {
      this.setMetadata({currentDate: date});
    }
    
    return this.meta.currentDate;
  }
});
