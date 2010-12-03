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
        var value = item[field];
        
        if (typeof value == 'function') {
          value = value.call(item);
        }
        
        this.fillElement(elem, value);
      }
    }
    
    // TODO: code below should be in subclass
    
    if (item.itemID) {
      row.attr('value', item.itemID);
    }
    
    row.toggleClass('completed', item.completionDate !== null);
  },
  
  fillList: function(listElement, list) {
    if (!list) {
      return;
    }
    
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