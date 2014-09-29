App.View.Login = Backbone.View.extend({
  el: "#login",
  events: {
    "click button.loginAdmin": "loginAdmin",
    "click button.loginUser": "loginUser"
  },
  loginAdmin: function(){
    var self = this;

    self.assignUser("admin");
  },
  loginUser: function(){
    var self = this;

    self.assignUser("user");
  },
  assignUser: function(userId){
    var self = this;
    self.user = new App.Model.User({userId: userId});
    /**
     * Fetching the user details from the cloud. These details will be passed into any forms that are to be completed.
     */
    self.user.fetch({success: function(model, response, options){
      self.trigger("login");
      $('#form-integration-example-navbar button').show();
      self.$el.hide();
    }, error: function(model, response, options){
      App.views.alertView.show("User " + userId + " Does Not Exist. You can create this user in the Data Browser.");
    }});
  },
  isAdminUser: function(){
    return this.user.id === "admin";
  }
});