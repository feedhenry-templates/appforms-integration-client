/**
 * Base view of all the views to render job lists.
 *
 * Jobs are in one of 3 different states
 *    - new
 *    - inProgress
 *    - queued
 *    - error
 *    - complete
 *
 * Each of these states has its own view
 *    - NewJobList
 *    - InProgressJobList
 *    - QueuedJobList
 *    - ErrorJobList
 *    - CompleteJobList
 *
 * The JobList View is never instatiated on its own.
 *
 * @type {Backbone View}
 */

App.View.JobList = Backbone.View.extend({
  el: "#jobList",
  events: {
    "click button.button-showJob": "showJobDetails",
    "click button.btn-createJob": "createJob"
  },
  /**
   * Creating a new job
   *
   * A new job is created by the admin user contains a
   *
   *  - Job Details Form -- Filled out when creating a job
   *  - Job Completion Form -- Filled out when completing a form
   *
   * A user downloads the details submission and completes the completion form to complete the job.
   */
  createJob: function(e){
    var self = this;
    e.stopImmediatePropagation();

    self.$el.empty();

    var jobCreateView = new App.View.JobCreate();

    self.$el.append(jobCreateView.$el);
  },
  /**
   * A function that renders the Job view into this screen.
   *
   * The clicked button contains a reference to the id of the job that is to be rendered.
   *
   * @param e ->> The event passed when the function is called. This event contains the target of the button clicked.
   */
  showJobDetails: function(e){
    var self = this;
    e.stopImmediatePropagation();

    var jobId = $(e.currentTarget).data('id');

    var jobModel = App.collections.jobs.findWhere({jobId: jobId});

    var jobView = new App.View.Job({model: jobModel});

    self.$el.empty();

    self.$el.append(jobView.render());
  },
  render: function(){
    var self = this;

    self.$el.empty();

    App.views.alertView.show("Fetching Jobs");

    //Refreshing the collections - This only happens when viewing new jobs
    App.collections.jobs.fetch({
      success: function(){
        App.views.alertView.show("Fetching Jobs Complete. Now Fetching Updated Forms List");
        //Also refreshing forms as part of updating the jobs collection.
        self.refreshForms(function(err){
          if(err){
            App.views.alertView.show("Error Fetching Updated Forms List: " + err);
          } else {
            App.views.alertView.hide();
            self.renderJobs();
          }
        });
      },
      error: function(err){
        App.views.alertView.show("Error Loading Collection " + err);
      }
    });
  },
  /*
   * Rendering the list of jobs based on the job status
   */
  renderJobs: function(){
    var self = this;
    /**
     * The "Jobs" collection is filtered to find the job that has the current status.
     *
     * Note the "self.status" value is defined in either, NewJobList, InProgressJobList or CompleteJobList
     * @type {Array}
     */
    var filteredJobs = App.collections.jobs.where({status: self.status});

    //Using Handlebars to compile templates for ease of displays.
    //All templates are located in www/templates/appTemplates.html
    var jobListTemplate = Handlebars.compile($('#jobListTemplate').html());
    var jobItemTemplate = $('#jobItemTemplate').html();
    var c_jobItemTemplate = Handlebars.compile(jobItemTemplate);

    //Only showing the create jobs button if the user is an Admin user and are listing "new" jobs.
    var showCreateJobButton = App.views.login.isAdminUser() && (self.status === "new");

    var jobPanel = $(jobListTemplate({status: self.status, showCreate: showCreateJobButton}));

    var jobListEl = jobPanel.find('#jobList-' + self.status);

    //Each of the jobs is rendered as a list of buttons. Clicking on one of the buttons calls the "showJobDetails" function above.
    _.each(filteredJobs, function(job){
      var jobView = c_jobItemTemplate(job.toJSON());
      jobListEl.append(jobView);
    });

    self.$el.append(jobPanel);
  },
  /**
   * Refreshing forms from the cloud. This checks if the forms have been updated.
   */
  refreshForms: function(cb){

    //If you want to check for any updates to the form, pass the fromRemote: true option to the getForms API call.
    //Passing fromRemote: false will load the form list from local storage only.

    //The forms model contains a list of forms associated with this app.
    //Note: forms does not contain the full definition of the form.
    $fh.forms.getForms({fromRemote: true}, cb);
  }
});


/**
 * List View for jobs that have a status of "new"
 * @type {Backbone View}
 */
App.View.NewJobList = App.View.JobList.extend({
  status: "new"
});

/**
 * List View for jobs that have a status of "inProgress"
 * @type {Backbone View}
 */
App.View.InProgressJobList = App.View.JobList.extend({
  status: "inProgress"
});

/**
 * List View for jobs that have a status of "queued".
 *
 * Queued jobs are ready for upload to the server
 * @type {Backbone View}
 */
App.View.QueuedJobList = App.View.JobList.extend({
  status: "queued"
});

/**
 * List View for jobs that have a status of "error".
 *
 * Error jobs encountered an error when uploading to the server.
 * @type {Backbone View}
 */
App.View.ErrorJobList = App.View.JobList.extend({
  status: "error"
});

/**
 * List View for jobs that have a status of "complete"
 * @type {Backbone View}
 */
App.View.CompleteJobList = App.View.JobList.extend({
  status: "complete"
});

