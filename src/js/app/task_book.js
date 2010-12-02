/*global GroupedCollection MergedCollection Task subclass */

function TaskBook(bookID) {
  TaskBook.baseConstructor.call(this, {collectionID:'taskbook_' + bookID, groupings:['startDate', 'dueDate']});
  this.metadata({currentDate: null});
  this.dateGroups = new MergedCollection(this.grouping('startDate'), this.grouping('dueDate'));
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
    return $.map(this.dateGroups.all(), function(item) {
      return item.itemID;
    });
  }
});
