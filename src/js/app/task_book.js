/*global GroupedCollection Task subclass */

function TaskBook(bookID) {
  TaskBook.baseConstructor.call(this, {collectionID:'taskbook_' + bookID, groupings:['startDate', 'dueDate']});
  this.metadata({currentDate: null});
  this.dateGroups = null;
}

subclass(TaskBook, GroupedCollection);

$.extend(TaskBook.prototype, {
  currentDate: function(date) {
    if (date) {
      this.metadata({currentDate: date});
    }
    
    return this.metadata().currentDate;
  },
  
  activeDates: function() {
      // TODO: update incrementally
    
    //if (!this.dateGroups) {
      this.dateGroups = this.groups('startDate').concat(this.groups('dueDate')).unique().sort();
    //}
    
    return this.dateGroups;
  }
});