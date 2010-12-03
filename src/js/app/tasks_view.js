/*global subclass View YMD */

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
      return false;
    });
    
    $('.startDate, .dueDate').live('click', function() {
      self.dateClick($(this));
      return false;
    });
  
    self.taskDump.click(function() {
      this.select();
      return false;
    });
    
    self.taskPopup.keydown(function(e) {
      if (e.which == 13) {
        self.toggleTaskPopup();
        return false;
      }
    });
    
    // $('body').click(function() {
    //   self.dismissPopups();
    // });
  
    self.controller.book.bindEvent('metadataChanged', function(e) {
      self.currentDateChange();
    });
    
    self.controller.book.bindEvent('itemAdded', function(e, task){
      self.bookChange();
    });
    
    self.controller.book.bindEvent('itemRemoved', function(e, task){
      self.bookChange();
    });
  
    self.controller.book.bindEvent('itemChanged', function(e, task){
      self.taskChange(task);
    });
    
    self.controller.book.grouping('startDate').bindEvent('itemAdded', function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('dueDate').bindEvent('itemAdded', function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('startDate').bindEvent('itemRemoved', function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('dueDate').bindEvent('itemRemoved', function(book, task){
      self.fillDateSelect();
    });
    
    self.controller.book.grouping('startDate').bindEvent('itemChanged', function(book, task){
      self.fillActions();
    });
    
    self.controller.book.grouping('dueDate').bindEvent('itemChanged', function(book, task){
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
  
  fillDateList: function(dateProp, list) {
    var date = this.controller.book.currentDate();
    
    if (date) {
      var group = this.controller.book.group(dateProp, date);
      
      if (group) {
        this.fillList(list, group.all());
      }
    }
  },
  
  fillActions: function() {
    this.fillDateList('startDate', this.actionList);
  },
  
  fillDueTasks: function() {
    this.fillDateList('dueDate', this.dueTaskList);
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
    
    this.taskPopup.find('.goal').val(task.goal);
    this.taskPopup.find('.goal').blur();
    
    this.taskPopup.find('.action').val(task.action ? task.action : null);
    this.taskPopup.find('.action').blur();
  },
  
  // TODO: get toggleXXPopup methods to share code
  // TODO: use data-task attribute instead of value for all taskRows
  
  toggleTaskPopup: function(taskRow) {
    var task = this.taskPopup.data('task', task);
    var elem = taskRow ? taskRow.find('.displayString, .goal') : null;
    
    if (this.taskPopup.is(':visible')) {
      var oldElem = this.taskPopup.data('elem');
      oldElem.removeClass('selected');
      
      if (!taskRow || oldElem.equals(elem)) {
        var properties = {};
        var taskAction = this.taskPopup.find('.action').val().trim();
        
        if (taskAction.length > 0 || task.action) {
          properties['action'] = taskAction;
        }
        
        properties['goal'] = this.taskPopup.find('.goal').val().trim();
        task.setProperties(properties);
        
        this.taskPopup.slideUp("fast");
        return;
      }
    }
    
    var showDates = taskRow.find('.startDate').length === 0;
    var taskID = taskRow.attr('value');
    task = this.controller.book.get(taskID);
    
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
  },
  
  dismissPopups: function() {
    if (this.taskPopup.is(':visible')) {
      this.toggleTaskPopup();
    }
    
    if (this.calendarPopup.is(':visible')) {
      this.toggleCalendarPopup();
    }
  }
});