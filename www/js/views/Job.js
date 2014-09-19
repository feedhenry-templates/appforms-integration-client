/**
 * Backbone view for rendering a single job.
 *
 * In this case, the job fetches the form list from local memory as it has been fetched before.
 *
 * When selecting
 */

App.View.Job = Backbone.View.extend({
  events:{
    "click button.btn-edit-submission": "editSubmission", //Button to edit the current submission,
    "click button.btn-view-submission": "viewJobDetails", //Button to view the current submission
    "click button.btn-completeJob": "formSelected", //Button to complete the job using the completion form assigned to the job.
    "click button.btn-viewJobDetails": "viewJobDetails" //Views the submission that was created as part of job creation.
  },
  initialize: function(options){
    var self = this;
    self.model = options.model;

    _.bindAll(this, "listenForFormEvents");
  },
  /**
   * View job details renders the submission that was created in read-only mode.
   *
   * Note: this submission may not currently exist on the local device. Therefore, the client will have to download the
   * submission to the local device first. This function demonstrates the process.
   */
  viewJobDetails: function(e){
    var self = this;

    var currentTarget = $(e.currentTarget);

    var remoteSubmissionId = currentTarget.data("submissionid");

    /**
     * Rendering The Form
     */
    self.renderForm({remoteSubmissionId: remoteSubmissionId, readOnly: true});
  },
  /**
   * Loading up a submission that has already been saved to the local storage.
   * @param e
   */
  editSubmission: function(e){
    var self = this;

    App.views.alertView.show("Loading Submission.");
    // The submission id was added to the 'Edit Submission' button when rendering the job.
    //Here we are just getting that data from the element.
    var submissionId = $(e.currentTarget).data('submissionid');

    /**
     * Initialising the Form View with the submission ID.
     *
     * Note: In this case, theres is no need to include a form ID as a submission will already contain a reference to a formId.
     * @type {App.View.FormView}
     */

    self.renderForm({submissionId: submissionId});
  },
  /**
   * Here, the details of the job are rendered to the screen.
   * As part of this rendering, the list of forms available to complete the submission is added to a dropdown button.
   *
   * If a job is in-progress, the submission ID related to the form is rendered as a button to continue editing the submission.
   * @returns {*}
   */
  render: function(){
    var self = this;
    var template = $('#jobDetailTemplate').html();

    var compiledTemplate = Handlebars.compile(template);

    App.views.alertView.show("Loading Form List From Local Storage");

    var jobJSON = self.model.toJSON();

    //Rendering the submission as a button
    var submissionId = localStorage.getItem(self.model.id);
    delete jobJSON.submissionId;

    var jobDetailsData = {
      job: jobJSON
    };

    //If there is already a submission associated with the job, then load the submission.
    if(submissionId){
      jobDetailsData.submissionId = submissionId;
    }

    jobDetailsData[jobDetailsData.job.status] = true;

    App.views.alertView.hide();
    self.$el.append(compiledTemplate(jobDetailsData));
    return self.$el;
  },
  /**
   * Setting the Job status
   */
  setJobStatus: function(status, cb){
    var self = this;
    self.model.set("status", status);

    /**
     * Saving the updated model to the server.
     *
     * This is done through the "Job" model using the <<mbaas-url>>/jobs  url
     */
    self.model.save(self.model.toJSON(),{success: function(){
      return cb();
    }, error: function(err){
      return cb(err);
    }});
  },
  /**
   * Completing the job will update the "status" field of the Job Model to "complete"
   */
  completeJob: function(){
    var self = this;
    /**
     * Setting the status to "complete"
     */

    App.views.alertView.show("Updating Job " + self.model.id + " to Complete");

    self.setJobStatus("complete", function(err){
      if(err){
        App.views.alertView.show("Error Updating Job " + self.model.id + " to Complete: " + err);
      } else {
        App.views.header.showCompletedJobList();
      }
    });
  },
  /**
   * Marking the job as "inProgress". This will update the "status" field of the Job Model to "inProgress"
   */
  inProgressJob: function(){
    var self = this;
    /**
     * Setting the status to "inProgress"
     */

    App.views.alertView.show("Updating Job " + self.model.id + " to In Progress");

    self.setJobStatus("inProgress", function(err){
      if(err){
        App.views.alertView.show("Error Updating Job " + self.model.id + " to In Progress: " + err);
      } else {
        App.views.header.showInProgressJobList();
      }
    });
  },
  /**
   * Marking the job as "queued". This will update the "status" field of the Job Model to "queued"
   */
  queuedJob: function(){
    var self = this;
    /**
     * Setting the status to "queued"
     */

    App.views.alertView.show("Updating Job " + self.model.id + " to In Progress");

    self.setJobStatus("queued", function(err){
      if(err){
        App.views.alertView.show("Error Updating Job " + self.model.id + " to Queued: " + err);
      } else {
        App.views.header.showQueuedJobList();
      }
    });
  },
  /**
   * Marking the job as "error". This will update the "status" field of the Job Model to "error"
   */
  errorJob: function(){
    var self = this;
    /**
     * Setting the status to "error"
     */

    App.views.alertView.show("Updating Job " + self.model.id + " to Review");

    self.setJobStatus("error", function(err){
      if(err){
        App.views.alertView.show("Error Updating Job " + self.model.id + " to Review: " + err);
      } else {
        App.views.header.showErrorJobList();
      }
    });
  },
  /**
   * When a form has been selected from the list, the form needs to be rendered for completion.
   * @param e --> The event contains the target selected, which contains the formid (See www/templates/appTempaltes.html)
   */
  formSelected: function(e){
    var self = this;
    var currentTarget = $(e.currentTarget);

    var formId = currentTarget.data('formid');
    App.views.alertView.show("Loading Form Definition");

    self.renderForm({formId: formId});
  },
  /**
   * Listening for any form events that may be emitted
   */
  listenForFormEvents:function(){
    var self = this;

    self.listenToOnce(self.formView, "saveDraft", function(localSubmissionId){
      // Associating the job with the submission that was saved.

      //Storing this localSubmissionId to local storage
      //Don't want to persist a local id to the server.
      localStorage.setItem(self.model.id, localSubmissionId);

      self.inProgressJob();
    });

    self.listenToOnce(self.formView, "queued", function(remoteSubmissionId){
      self.model.set("completeSubmissionId", remoteSubmissionId);
      self.queuedJob();
    });

    self.listenToOnce(self.formView, "error", function(error){
      self.errorJob();
    });

    self.listenToOnce(self.formView, "complete", function(localSubmissionId, remoteSubmissionId){
      localStorage.setItem(self.model.id, localSubmissionId);
      self.model.set("completeSubmissionId", remoteSubmissionId);
      self.completeJob();
    });
  },
  /**
   * Rendering a form into the view.
   *
   * There are two options for rendering a form:
   *  - Backbone SDK: The $fh.forms.backbone SDK combines all of the logic needed to render/validate/submit a complete form.
   *  - Custom Form View: A Form View where the rendering/validation/submission is handled by the App.
   *
   *  Note: Form Rendering can be changed in the "Settings" View for convenience.
   */
  renderForm: function(params){
    var self = this;

    //Loading the form model associated with the form ID.
    //Note: This is an asynchronous function as the form definition may not have been loaded from local memory/remote yet.
    App.FormFunctions.loadForm(params, function(err, form){
      if(err){
        return App.views.alertView.show("Error loading form: " + err);
      }

      App.views.alertView.show("Loading Submission");

      //Assigning the loaded form to params so a new submission can be created from it if necessary.
      params.form = form;

      /**
       * Loading a submission based on the params.
       *
       * The submission can either be stored locally or be downloaded from remote.
       */
      App.FormFunctions.loadSubmission(params, function(err, response){
        if(err){
          return App.views.alertView.show("Error loading Submission: " + err);
        }

        //In the case of a download submission, the form model is loaded from the downloaded submission.
        var form = response.form || params.form;
        //The submission to be rendered.
        var submission = response.submission;

        _.extend(params, {form: form, submission: submission});


        if(App.renderChoice === "backboneSDK"){
          self.renderBackboneSDK(params);
        } else if (App.renderChoice === "customFormView"){
          self.renderCustomForm(params);
        } else {
          console.error("No Render Choice");
        }
      });
    });
  },
  /**
   * Rendering the custom Form View. All of the logic for rendering/validation/submission is handled by the app.
   */
  renderCustomForm: function(params){
    var self = this;

    //Initialising a new Form View related to the form id.
    self.formView = new App.View.FormView(params);

    self.listenForFormEvents();

    //Hiding the table.
    self.$el.find('.jobDetailsTable').hide();

    //Adding the form to this element.
    self.$el.append(self.formView.render().$el);
    App.views.alertView.hide();
  },
  /**
   * Rendering the $fh.forms.backbone SDK Form View. All of the logic for rendering/validation/submission is handled by the
   * $fh.forms.backbone SDK
   */
  renderBackboneSDK: function(params){
    var self = this;

    /**
     * First get the theme associated with the app.
     */
    $fh.forms.getTheme({fromRemote: true, css: true}, function(err, themeCSS){
      if(err){
        return App.views.alertView.show("Error Loading Theme: " + err);
      }

      //Apply Theme
      if ($('#fh_appform_style').length > 0) {
        $('#fh_appform_style').html(themeCSS);
      } else {
        $('head').append('<style id="fh_appform_style">' + themeCSS + '</style>');
      }

      //Rendering the form into this element
      params.parentEl = self.$el;

      self.formView = new App.View.FormSDK(params);


      App.views.alertView.show("Loading Form and Submission Into Form View");
      self.formView.loadForm(params, function(){
        //Registering any events the submission can emit. These are to be surfaced to the FormView.
        //This is a good instance of customising the $fh.forms.backbone SDK Form View.
        self.formView.registerSubmissionEvents();
        self.listenForFormEvents();
        self.formView.render();
        App.views.alertView.hide();
      });
    });
  }
});