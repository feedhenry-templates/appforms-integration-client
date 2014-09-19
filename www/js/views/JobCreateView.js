/**
 * A Job can be created by selecting and completing a "Job Detail Form" and selecting a "Job Completion Form" for the
 * user to complete.
 * @type {*}
 */
App.View.JobCreate = Backbone.View.extend({
  events:{
    "change select.jobDetailsForm" : "changeJobDetails",
    "change select.completeJobForm" : "changeJobComplete",
    "blur input.newJobId": "changeJobId",
    "click button.btn-submit": "createJob"
  },
  initialize: function(options){
    var self = this;

    self.job = new App.Model.Job();
    self.render();
    return self;
  },
  render: function(){
    var self = this;
    var createTemplate = $('#jobCreateTemplate').html();

    var c_createTemplate = Handlebars.compile(createTemplate);

    $fh.forms.getForms({fromRemote: false}, function(err, forms){
      if(err){
        App.views.alertView.show("Error Loading Forms From Local Storage " + err);
      }

      self.$el.append(c_createTemplate({forms: forms.getFormsList()}));

      self.$el.find('select.jobDetailsForm').val(forms.getFormsList()[0]._id);
      self.$el.find('select.completeJobForm').val(forms.getFormsList()[0]._id);

      self.$el.find('select.jobDetailsForm').trigger('change');
      self.$el.find('select.completeJobForm').trigger('change');
    });
  },
  /**
   * Function to perform job creation,
   *
   * Job creation involves checking that a completion form and job id has been assigned and the details form has been
   * submitted correctly
   */
  createJob: function(){
    var self = this;

    App.views.alertView.show("Creating New Job.");

    if(!self.job.get("jobId")){
      App.views.alertView.show("No Job Id Entered.");
      return;
    }

    if(!self.job.get("completionForm")){
      App.views.alertView.show("No Job Completion Form Selected.");
      return;
    }

    if(!self.formView){
      return;
    }

    /**
     * The submission for the job details may have already been uploaded. No need to submit again.
     */
    if(!self.job.get("jobDetailsSubmissionId")){
      self.formView.submit();
    } else {
      self.job.save(self.job.toJSON(),{success: function(){
        App.views.alertView.show("Job Created with ID: " + self.job.id);
        App.views.header.showNewJobList();
      }, error: function(err){
        App.views.alertView.show("Error Saving job ID: " + self.job.id);
        App.views.header.showNewJobList();
      }});
    }
  },
  /**
   * Changing the form that is rendered to fill out the job details.
   */
  changeJobDetails: function(e){
    var self = this;
    var currentTarget = $(e.currentTarget);
    var formId = currentTarget.find("option:selected").val();


    self.renderForm({formId: formId, hideButtons: true});
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
          App.views.alertView.show("No Render Choice Selected.");
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
    self.$el.find('#formRenderEl').empty();
    self.$el.find('#formRenderEl').append(self.formView.render().$el);
    App.views.alertView.hide();
  },
  /**
   * Rendering the $fh.forms.backbone SDK Form View. All of the logic for rendering/validation/submission is handled by the
   * $fh.forms.backbone SDK
   */
  renderBackboneSDK: function(params){
    var self = this;

    /**
     * First Get The Theme Associated With The App
     */
    $fh.forms.getTheme({fromRemote: true, css: true}, function(err, themeCSS){
      if(err){
        return App.views.alertView.show("Error Loading Theme: " + err);
      }

      //Apply Theme CSS
      if ($('#fh_appform_style').length > 0) {
        $('#fh_appform_style').html(themeCSS);
      } else {
        $('head').append('<style id="fh_appform_style">' + themeCSS + '</style>');
      }

      //The form is to be rendered into this element.
      params.parentEl = self.$el.find('#formRenderEl');

      self.formView = new App.View.FormSDK(params);

      App.views.alertView.show("Loading Form and Submission Into Form View");
      self.formView.loadForm(params, function(){
        self.formView.registerSubmissionEvents();

        //Disabling drafts is useful for when a form submission is required to complete a larger overall task.
        self.formView.disableDrafts();

        //Custom function added to the $fh.forms.backbone Form View to register listeners on submission events
        self.listenForFormEvents();

        self.formView.render();
        App.views.alertView.hide();
      });
    });
  },
  /**
   * Listening for any form events that may be emitted
   */
  listenForFormEvents:function(){
    var self = this;
    self.listenToOnce(self.formView, "queued", function(remoteSubmissionId){
      App.views.alertView.show("Submission Queued: " + remoteSubmissionId);
    });

    self.listenToOnce(self.formView, "error", function(error){
      App.views.alertView.show("Error Submitting Form: " + error);
    });

    self.listenToOnce(self.formView, "complete", function(localSubmissionId, remoteSubmissionId){
      App.views.alertView.show("Form Submission Complete: " + remoteSubmissionId);
      self.job.set("jobDetailsSubmissionId", remoteSubmissionId);
      App.collections.jobs.add(self.job);
      self.createJob();
    });
  },
  changeJobComplete: function(e){
    var self = this;
    var currentTarget = $(e.currentTarget);
    var formId = currentTarget.find("option:selected").val();

    self.job.set("completionForm", formId);
  },
  changeJobId: function(e){
    var self = this;
    var currentTarget = $(e.currentTarget);
    var newJobId = currentTarget.val();

    self.job.set("jobId", newJobId)
  }
});