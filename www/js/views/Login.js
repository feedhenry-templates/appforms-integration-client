App.View.Login = Backbone.View.extend({
  el: "#login",
  events: {
    "click button.loginAdmin": "loginAdmin",
    "click button.loginUser": "loginUser"
  },
  loginAdmin: function(){
    var self = this;
    self.user = "admin";
    self.trigger("login");
    $('#form-integration-example-navbar button').show();
    self.$el.hide();
  },
  loginUser: function(){
    var self = this;
    self.user = "user";
    self.trigger("login");
    $('#form-integration-example-navbar button').show();
    self.$el.hide();
  },
  isAdminUser: function(){
    return this.user === "admin";
  }
});