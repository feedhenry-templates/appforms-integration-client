/**
 * Convienient view for navigating between jobs.
 *
 */
App.View.Header = Backbone.View.extend({
  el: "#headerBar",
  events:{
    "click button" : "toggleDropdown",
    "click button.newJobs": "showNewJobList",
    "click button.inProgressJobs": "showInProgressJobList",
    "click button.queuedJobs": "showQueuedJobList",
    "click button.errorJobs": "showErrorJobList",
    "click button.completeJobs": "showCompletedJobList",
    "click button.showSettings": "showSettingsView"
  },
  isAdminUser: function(){
    return this.user === "admin";
  },
  showHome: function(){
    App.views.newJobList.render();
  },
  showNewJobList: function(e){
    App.views.newJobList.render();
  },
  showInProgressJobList: function(e){
    App.views.inProgressJobList.render();
  },
  showQueuedJobList: function(){
    App.views.queuedJobList.render();
  },
  showErrorJobList: function(){
    App.views.errorJobList.render();
  },
  showCompletedJobList: function(){
    App.views.completeJobList.render();
  },
  showSettingsView: function(){
    App.views.settings.render();
  },
  toggleDropdown: function(){
    var self = this;
    self.$el.find('#form-integration-example-navbar').collapse('toggle');
  }
});



