/**
 * Convieniet view for alerting the user to some action occuring.
 *
 * @type {Backbone View}
 */

App.View.AlertView = Backbone.View.extend({
  el: "#formsModal",
  show: function(message){
    /**
     * Showing modal
     */
    var self = this;
    self.$el.find(".modal-body").html(message);
    self.$el.modal('show');
  },
  hide: function(timeout){
    var self = this;

    if(timeout){
      setTimeout(function(){
        self.$el.modal('hide');
      }, timeout);
    } else {
      self.$el.modal('hide');
    }

  }
});

