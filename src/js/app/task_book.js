/*global GroupedCollection Task subclass */

function TaskBook(bookID) {
  TaskBook.baseConstructor.call(this, {collectionID:'taskbook_' + bookID, groupings:['startDate', 'dueDate']});
  this.meta.currentDate  = null;
  this.dateGroups = null;
}

subclass(TaskBook, GroupedCollection);

$.extend(TaskBook.prototype, {
  currentDate: function(date) {
    if (date) {
      this.setMetadata({currentDate: date});
    }
    
    return this.meta.currentDate;
  },
  
  activeDates: function() {
      // TODO: update incrementally
    
    //if (!this.dateGroups) {
      this.dateGroups = this.groups('startDate').concat(this.groups('dueDate')).unique().sort();
    //}
    
    return this.dateGroups;
  }
});
