/**
 *
 * Basic Hybrid App For Demonstrating the integration of forms into an existing app.
 *
 * This is a fully-functional app as it currently exists. This app lists jobs that are stored in your databrowser.
 *
 * By creating a collection called "jobs" in your cloud app databrowser with a status if "new", "inProgress" or "complete",
 * you will see the jobs listed in this app.
 *
 */

App.Router = Backbone.Router.extend({
  routes:{
    "*path": "login"
  },
  initialize: function(){
    var self = this;
    /**
     * Setting default rendering choice
     *
     *  Can be:
     *     - "backboneSDK" to use the $fh.forms.backbone SDK for rendering
     *     - "customFormView" to use the custom Form View (Note: the custom form view does not contain implementations for all field types).
     * @type {string}
     */

    App.renderChoice = "backboneSDK";

    //Setting up views.
    App.views.header = new App.View.Header();
    App.views.alertView = new App.View.AlertView();

    //View for viewing "new" jobs.
    App.views.newJobList = new App.View.NewJobList();

    //View for viewing "inProgress" jobs.
    App.views.inProgressJobList = new App.View.InProgressJobList();

    //View for viewing "queued" jobs.
    App.views.queuedJobList = new App.View.QueuedJobList();

    //View for viewing "error" jobs.
    App.views.errorJobList = new App.View.ErrorJobList();

    //View form viewing "completed" jobs.
    App.views.completeJobList = new App.View.CompleteJobList();

    //Login View
    App.views.login = new App.View.Login();

    //Settings View
    App.views.settings = new App.View.Settings();

    self.login();
  },
  /**
   * Default route for the app. The $fh.forms Client API is initialised first before showing the login screen.
   */
  login: function(){
    var self = this;
    /**
     * Before showing the home screen, we initialise the $fh.forms client api
     *
     *
     * Note: For local development, if you want to interact with Forms related to your project, you can pass
     *
     * config: {
     *    cloudHost: "<<Host Name For Your Cloud App.>>"
     *  }
     *
     * All subsequent $fh.forms requests (e.g. $fh.forms.getForms) will now interact with the cloud app you specified.
     */
    App.views.alertView.show("Initialising Forms API");
    $fh.forms.init({config: {}}, function(err){
      if(err){
        return App.views.header.show("Error Initialising Forms " + err);
      }
      App.views.alertView.hide();
      $('#form-integration-example-navbar button').hide();
      self.listenTo(App.views.login, "login", this.listJobs);
    });
  },
  listJobs: function(){
    App.views.alertView.hide();
    App.views.header.showHome();
  }
});

$(function(){
  App.router = new App.Router();
});



