/*global subclass YMD */

function View(controller) {
  this.controller = controller;
  var self = this;
  
  /* Cache view elements */
  $('[id]').each(function(){
    self[this.id] = $('#' + this.id);
  });
  
  /* Route click handlers to buttons */
  // TODO: put in router method, for subclasses to override
  $('button').click(function(){
    var handler = self[this.id + 'Click'];
    
    if (typeof handler == 'function') {
      return handler.call(self);
    } else {
      console.log('Click on button ' + this.id + ' not handled');
    }
    
    return true;
  });
}

View.prototype = {
  dateString: function(value) {
    return new YMD(value).toString('yy M dd');
  },
  
  isDateElement: function(elem) {
    return elem.attr('class').indexOf('ate') != -1; // TODO: case insensitive
  },
  
  fillElement: function(elem, value) {
    elem.html(this.isDateElement(elem) ? this.dateString(value) : value);
  },
  
  fillRow: function(row, item) {
    for (var field in item) {
      var elem = row.find('.' + field);
    
      if (elem.length > 0) {
        this.fillElement(elem, item[field]);
      }
    }
    
    // TODO: code below should be in subclass
    
    if (item.itemID) {
      row.attr('value', item.itemID);
    }
    
    row.toggleClass('completed', item.completionDate !== null);
  },
  
  fillList: function(listElement, list) {
    var templateRow = listElement.data('template');
    
    if (!templateRow) {
      templateRow = listElement.find('.template').detach();
      listElement.data('template', templateRow);
    }
    
    listElement.html('');
    
    for (var i = 0; i < list.length; ++i) {
      var item = list[i];
      var row = templateRow.clone();
      row.removeClass('template');
      
      if (typeof item == 'object') {
        this.fillRow(row, item);
      } else {
        this.fillElement(row, item);
        row.attr('value', item);
      }
      
      listElement.append(row);
    }
  }
};

function TasksView(controller) {
  TasksView.baseConstructor.call(this, controller);
  this.router();
}

subclass(TasksView, View);

$.extend(TasksView.prototype, {
  router: function() {
    var self = this;
  
    self.dateSelect.change(function() {
      self.controller.setCurrentDate(self.selectedDate());
    });
  
    self.taskGoalField.keydown(function(e) {
      if (e.which == 13) {
        self.addButtonClick();
        return false;
      }
    });
  
    $('.task').live('click', function() {
      self.taskClick($(this));
    });
    
    $('.startDate, .dueDate').live('click', function() {
      self.dateClick($(this));
      return false;
    });
  
    self.taskDump.click(function() {
      this.select();
      return false;
    });
  
    self.controller.book.event.metadataChanged.attach(function(book){
      self.currentDateChange();
    });
    
    self.controller.book.event.itemAdded.attach(function(book, item){
      self.bookChange();
    });
    
    self.controller.book.event.itemRemoved.attach(function(book, item){
      self.bookChange();
    });
  
    self.controller.book.event.itemChanged.attach(function(book, task){
      self.taskChange(task);
    });
    
    self.controller.book.grouping('startDate').event.groupAdded.attach(function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('dueDate').event.groupAdded.attach(function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('startDate').event.groupRemoved.attach(function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('dueDate').event.groupRemoved.attach(function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('startDate').event.groupChanged.attach(function(book, task){
      self.fillActions();
    });
    
    self.controller.book.grouping('dueDate').event.groupChanged.attach(function(book, task){
      self.fillDueTasks();
    });
    
    $('#calendarPopup').datepicker({
      dateFormat: 'yy-m-d',
      onSelect: function(date) {
        self.dateChange(date);
      }
    });
  },
  
  render: function() {
    this.fillTaskList();
    this.fillDateSelect();
    this.fillActions();
    this.fillDueTasks();
  },
  
  bookChange: function(props) {
    this.fillTaskList();
  },
    
  currentDateChange: function(props) {
    this.fillActions();
    this.fillDueTasks();
  },
  
  taskChange: function(task) {
    var taskRows = $('[value=' + task.itemID + ']');
    var self = this;
    
    taskRows.each(function() {
      self.fillRow($(this), task);
    });
    
    if (this.taskPopup.is(':visible') && this.taskPopup.data('task') === task) {
      this.fillTaskPopup(task);
    }
  },
  
  addButtonClick: function() {
    this.controller.addTask(this.taskGoalField.val());
    this.taskGoalField.val('');
  },
  
  loadButtonClick: function() {
    this.controller.loadFromDump(this.taskDump.val());
    this.render();
  },
  
  prevDateButtonClick: function() {
    var opt = this.dateSelect.find('option:selected').prev();
    
    if (opt) {
      opt.attr('selected', true);
      this.dateSelect.change();
    }
  },
  
  nextDateButtonClick: function() {
    var opt = this.dateSelect.find('option:selected').next();
    
    if (opt) {
      opt.attr('selected', true);
      this.dateSelect.change();
    }
  },
  
  completedButtonClick: function() {
    var task = this.taskPopup.data('task');
    this.toggleTaskPopup();
    this.controller.markTaskCompleted(task);
  },
  
  taskClick: function(task) {
    this.toggleTaskPopup(task);
  },
  
  dateClick: function(elem) {
    this.toggleCalendarPopup(elem);
  }, 
  
  dateChange: function(date) {
    var task = this.calendarPopup.data('task');
    var property = this.calendarPopup.data('property');
    this.toggleCalendarPopup();
    task.setProperty(property, date);
  },
  
  deleteButtonClick: function() {
    var task = this.taskPopup.data('task');
    this.toggleTaskPopup();
    this.controller.deleteTask(task);
  },
  
  fillTaskList: function() {
    this.fillList(this.taskList, this.controller.book.all());
    $('#taskDump').val(window.localStorage['collection_taskbook_default']);
  },
  
  fillDateSelect: function() {
    this.fillList(this.dateSelect, this.controller.book.activeDates());
    this.dateSelect.val(this.controller.book.currentDate());
  },
  
  fillActions: function() {
    this.fillList(this.actionList, this.controller.book.group('startDate', this.controller.book.currentDate()));
  },
  
  fillDueTasks: function() {
    this.fillList(this.dueTaskList, this.controller.book.group('dueDate', this.controller.book.currentDate()));
  },
  
  selectedDate: function() {
    return this.dateSelect.find('option:selected').val();
  },
  
  fillTaskPopup: function(task) {
    this.taskPopup.data('task', task);
    
    if (task.completionDate) {
      this.completedButton.text('Incomplete');
    } else {
      this.completedButton.text('Complete');
    }
    
    this.taskPopup.find('.startDate').text(this.dateString(task.startDate));
    this.taskPopup.find('.dueDate').text(this.dateString(task.dueDate));
  },
  
  // TODO: get toggleXXPopup methods to share code
  // TODO: use data-task attribute instead of value for all taskRows
  
  toggleTaskPopup: function(taskRow) {
    var elem = taskRow ? taskRow.find('.goal') : null;
    
    if (this.taskPopup.is(':visible')) {
      var oldElem = this.taskPopup.data('elem');
      oldElem.removeClass('selected');
      
      if (!taskRow || oldElem.equals(elem)) {
        this.taskPopup.slideUp("fast");
        return;
      }
    }
    
    var showDates = taskRow.find('.startDate').length === 0;
    var taskID = taskRow.attr('value');
    var task   = this.controller.book.get(taskID);
    
    this.fillTaskPopup(task);
    elem.addClass('selected');
    
    this.taskPopup.find('.startDate, .dueDate').toggle(showDates);
    
    this.taskPopup
      .data('elem', elem)
      .css( {
        left: elem.offset().left + "px", 
        top: taskRow.offset().top + taskRow.outerHeight() + 1 + "px"
      })
      .slideDown("fast");
  },
  
  toggleCalendarPopup: function(elem) {
    if (this.calendarPopup.is(':visible')) {
      var oldElem = this.calendarPopup.data('elem');
      oldElem.removeClass('selected');
      
      if (!elem || oldElem.equals(elem)) {
        this.calendarPopup.fadeOut("fast");
        return;
      }
    }
    
    var parent = elem.parent();
    var task = parent.data('task');
    
    if (!task) {
      var taskID = parent.attr('value');
      task = this.controller.book.get(taskID);
    }
    
    var property = elem.attr('class');
    elem.addClass('selected');
    var date = task[property];
    
    this.calendarPopup
      .data('elem', elem)
      .data('property', property)
      .data('task', task)
      .datepicker('setDate', new YMD(date).toDate())
      .css( {
        left: elem.offset().left + "px", 
        top: elem.offset().top + elem.outerHeight() + 3 + "px"
      })
      .fadeIn("fast");
  }
});