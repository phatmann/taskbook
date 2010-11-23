Date.prototype.clearTime = function() 
{
  this.setHours(0); 
  this.setMinutes(0);
  this.setSeconds(0); 
  this.setMilliseconds(0);
  return this;
};

// http://www.martienus.com/code/javascript-remove-duplicates-from-array.html
Array.prototype.unique = function(transform) {
	var r = [];
	o:for(var i = 0, n = this.length; i < n; i++) {
		for(var x = 0, y = r.length; x < y; x++) {
			if(r[x]==this[i]) {
				continue o;
			}
		}
		r[r.length] = transform ? transform(this[i]) : this[i];
	}
	return r;
};

(function($){
	jQuery.fn.equals = function(selector) {
		return $(this).get(0)==$(selector).get(0);
	};
})(jQuery);