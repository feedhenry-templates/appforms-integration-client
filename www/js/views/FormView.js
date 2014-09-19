/**
 * Custom Form View for rendering a form and adding values to a submission.
 *
 * In this view, the submission values are populated manually into a form rendered by this view.
 *
 * Note: This view demonstrates the interaction of rendered fields and submissions. Not all fields are rendered using this view.
 *
 * To see a complete form rendering all available fields, use the FormViewSDK View Instead.
 *
 * @type {Backbone View}
 */

App.View.FormView = Backbone.View.extend({
  events: {
    "click button.btn-draft": "saveDraft", //Button the save the form as a draft submission for editing later.
    "click button.btn-submit": "submitForm",//Button to submit the form to the remote server.

    "blur input": "validateInput" // Adding an event to validate data entered into the field against the field definition.
  },
  initialize: function(options){
    var self = this;

    //Binding the form rendering functions to the view element as they interact directly with the view.
    _.bindAll(this, 'renderForm', 'renderPage', 'renderField');

    //The form model that is to be rendered
    self.model = options.form;

    //The submission model to be rendered into the form view.
    //This submission may have existed on the Client or may have been downloaded for readOnly Viewing.
    self.submission = options.submission;

    //If you want to view the submission as a read-only view. the readOnly parameter can be passed.
    self.readOnly = options.readOnly;

    //Hiding the "Save Draft" and "Complete" buttons.
    self.hideButtons = options.hideButtons;
  },
  render: function(){
    var self = this;
    self.renderForm();
    return self;
  },
  /**
   * Function to validate the current contents of the changed input.
   * Bound to the 'blur' event on input fields.
   * @param e The "blur" event on the input elements
   */
  validateInput: function(e){
    var self = this;
    var currentTarget = $(e.currentTarget);

    //The input field contains a data-field=<<fieldId>> when rendered using the Handlebars Template.
    var fieldId = currentTarget.data('fieldid');

    //The input index is important when dealing with repeating fields. (i.e. fields that can contain multiple data entries).
    //Currently we are using only a single input so index will always be 0.
    var inputIndex = currentTarget.data('index');

    var inputValue = currentTarget.val();

    //Having found the field ID, we can get access to the Field Model.
    var fieldModel = self.model.getFieldModelById(fieldId);

    //Disabling the input field before validating
    self.$el.find('#' + fieldId + '_' + inputIndex).prop('disabled', true);

    /**
     * Validating the input value against the definition of the field.
     *
     * Example of validation result:
     * "validation":{
       *         "fieldId":{
       *             "fieldId":"",
       *             "valid":true/false,
       *             "errorMessages":[
       *                 "length should be 3 to 5",
       *                 "should not contain dammit"
       *             ]
       *         }
       *     }
     */
    fieldModel.validate(inputValue, inputIndex, function(err, validationResult){
      if(err){
        App.views.alertView.show("Error validating field: " + err);
      }

      var fieldValidationResult = validationResult.validation[fieldId];

      var formGroupElement = self.$el.find('.form-group[data-fieldid="' + fieldId + '"]');
      var formErrorElement = self.$el.find('.formsError[data-fieldid="' + fieldId + '"]');


      if(!fieldValidationResult.valid){
        //Getting the field error messages.
        //Only interested in the first one for the moment.
        var fieldErrorMessages = fieldValidationResult.errorMessages;
        var fieldErrorMessage = fieldErrorMessages[0];
        //The field is invalid, find the error messages that make it invalid and display to the user.
        formGroupElement.removeClass('has-success').addClass('has-error');
        formErrorElement.html(fieldErrorMessage);
        formErrorElement.show();
      } else {
        //The field is valid. Let the user know that the entry is valid.
        formGroupElement.removeClass('has-error').addClass('has-success');
        formErrorElement.hide();
      }

      //Re-enabling the form input after validation
      self.$el.find('#' + fieldId + '_' + inputIndex).prop('disabled', false);

      //Checking rules for any actions
      self.checkRules();
    });
  },
  /**
   * Function to check for any Page & Field rules actions based on the Page / Field Rules defined in the studio.
   */
  checkRules: function(){
    var self = this;
    //First, populate the submission with all values in the current form

    self.saveFieldInputsToSubmission(function(err){
      if(err){
        return App.views.alertView.show("Error Populating Input Values To Submission: " + err);
      }

      //Having populated the submission with input values, we can now check the submission against any field/page rules
      /**
       * The rulesResult JSON structure.
       * rulesResult:
       *      {
       *          "actions": {
       *              "pages": {
       *                  "targetId": {
       *                      "targetId": "",
       *                      "action": "show|hide"
       *                  }
       *              },
       *              "fields": {
       *              }
       *          }
       *      }
       */
      self.submission.checkRules(function(err, rulesResult){
        if(err){
          return App.views.alertView.show("Error Checking Rules: " + err);
        }

        var ruleActions = rulesResult.actions;
        var fieldActions = ruleActions.fields;
        var pageActions = ruleActions.pages;

        //Performing actions that need to be performed on fields (show/hide)
        _.each(fieldActions, function(value, fieldId){
            var action = value.action;
            var fieldElement = self.$el.find('.form-group[data-fieldid="' + fieldId + '"]');

            if(action === "show"){
              fieldElement.show();
            } else {
              fieldElement.hide();
            }
        });

        //Performing actions that need to be performed on pages (show/hide)
        _.each(pageActions, function(value, pageId){
          var action = value.action;

          var pageElement = self.$el.find('.formPage[data-pageid="' + pageId + '"]');

          if(action === "hide"){
            pageElement.hide();
          } else {
            pageElement.show();
          }
        });
      });
    });
  },
  /**
   * Rendering a form involves rendering all of the pages of the form.
   *
   * All fields are located in the form pages.
   * @returns {*}
   */
  renderForm: function(){
    var self = this;
    self.$el.empty();

    var formModelToRender = self.model;

    /**
     * Forms are organised in the structure
     *
     * formModel: [PageModel, PageModel, ...]
     * PageModel: [FieldModel, FieldModel, ...]
     */
    var pageModels = formModelToRender.getPageModelList(); //Array of page models.

    _.each(pageModels, self.renderPage); //Rendering each page

    /**
     * Adding some control buttons (Save Draft, Complete etc)
     */
    if(!(self.readOnly || self.hideButtons)){
      var formButtonTemplate = $('#formButtons').html();
      var c_formButtonTemplate = Handlebars.compile(formButtonTemplate);

      self.$el.append(c_formButtonTemplate());
    }

    /**
     * IF there is a submission associated with the view, populate any field that already have data.
     */
    if(self.submission){
      self.populateSubmissionValuesToForm();
    }


    /*
     * Checking rules based on form initial values
     */
    self.checkRules();

    /**
     * If readOnly, disable any input value
     */
    if(self.readOnly){
      self.$el.find('input').prop("disabled", true);
    }

    return self;
  },
  /**
   * Rendering a page requires rendering each of the fields in a page.
   * @param pageModel
   */
  renderPage: function(pageModel){
    var self = this;
    var fieldModels = pageModel.getFieldModelList(); //Array of field models

    //Rendering the page into the form
    var pageBreak = $('#formPageBreak').html();
    var c_pageBreak = Handlebars.compile(pageBreak);

    var pageId = pageModel.getPageId(); //Used for identifying the page to add the fields to
    var pageName = pageModel.getName(); //Showing the page name.

    this.$el.append(c_pageBreak({id: pageId, name: pageName}));

    //Rendering each field of each page
    _.each(fieldModels, function(fieldModel){
      self.renderField(pageId, fieldModel);
    });
  },
  /**
   * Rendering each of the fields in a page into the page element.
   * @param pageId
   * @param fieldModel
   */
  renderField: function(pageId, fieldModel){
    var self = this;
    var pageEl = self.$el.find('#page-'+ pageId);

    var fieldTemplate = $('#fieldBasicView').html();
    var c_fieldTemplate = Handlebars.compile(fieldTemplate);
    var requiredClass = "";

    // It is possible to define a field as "required" in the studio. Here, this is shown to the user through a class
    //change.
    if(fieldModel.isRequired()){
      requiredClass = "required"
    }

    pageEl.append(c_fieldTemplate({
      id: fieldModel.getFieldId(),
      name: fieldModel.getName(),
      defaultValue: fieldModel.getDefaultValue(),
      type: fieldModel.getType(),
      requiredClass: requiredClass
    }));
  },
  /**
   * Saving the form as a draft. All field contents are stored to local memory.
   * @param e
   */
  saveDraft: function(e){
    var self = this;

    App.views.alertView.show("Saving Draft Data");

    /**
     * First, gather all input values into the submission
     */
    self.saveFieldInputsToSubmission(function(err){
      if(err){
        return App.views.alertView.show("Error: Saving Draft Data: " + err);
      }

      /**
       * Now that the submission has all of the values that are present in the form, the submission can now be saved as
       * a draft.
       */
      self.submission.saveDraft(function(err){
        if(err){
          return App.views.alertView.show("Error: Saving Draft Data: " + err);
        } else {

          //Triggering a saveDraft for the job to assign the local id of the submission to the job.
          self.trigger("saveDraft", self.submission.getLocalId());
        }
      });
    });
  },
  /**
   * Submitting the form to the cloud. (Note: this is not visible in the data browser.)
   * When completed, this submission will be visible in the Submission Editor.
   */
  submit: function(){
    var self = this;

    App.views.alertView.show("Populating Fields To Submission");

    /**
     * First, populate all input values into the submission
     */
    self.saveFieldInputsToSubmission(function(err){
      if(err){
        return App.views.alertView.show("Error Populating Fields To Submission: " + err);
      }

      /**
       * Resetting the events on the submission so they are not called multiple times.
       */
      self.submission.clearEvents();

      /**
       * If the submission emits 'validationerror', it means that the submission is not valid against the
       * current definition of the form.
       *
       * A JSON object is passed into this event representing any fields that are not valid and the reasons why.
       *
       * res:
       *      {
       *          "validation": {
       *              "fieldId": {
       *                  "fieldId": "",
       *                  "valid": true,
       *                  "errorMessages": [
       *                      "length should be 3 to 5",
       *                      "should not contain dammit",
       *                      "should repeat at least 2 times"
       *                  ]
       *              },
       *              "fieldId1": {
       *
       *              }
       *          },
       *          "valid": false
       *      }
       *
       */
      self.submission.on('validationerror', function(validationFields){
        //The form was invalid, marking any fields that were invalid

        _.each(validationFields, function(value, fieldId){

          //Only interested in the fieldId parameters.
          if(fieldId === "valid"){
            return;
          }

          var formGroupElement = self.$el.find('.form-group[data-fieldid="' + fieldId + '"]');
          var formErrorElement = self.$el.find('.formsError[data-fieldid="' + fieldId + '"]');
          //Getting the field error messages.
          //Only interested in the first one for the moment.
          var fieldErrorMessages = value.fieldErrorMessage;
          var fieldErrorMessage = fieldErrorMessages[0];
          //The field is invalid, find the error messages that make it invalid and display to the user.
          formGroupElement.removeClass('has-success').addClass('has-error');
          formErrorElement.html(fieldErrorMessage);
          formErrorElement.show();
        });

        App.views.alertView.show("Error submitting form: Validation Error.");
      });

      /**
       * When the submission has been queued, the form has been submitted to the remote Forms database.
       * It is now ready to upload any files that need to be uploaded.
       */
      self.submission.on("queued", function(remoteSubmissionId){
        self.trigger("queued", remoteSubmissionId);
      });

      /**
       * A progress event emitted any time the submission makes progress uploading the submission
       *
       * progress: {
       *    'formJSON': <<true/false>>, //determines if the submission JSON object (Basic Fields)
            'currentFileIndex': <<The current file uploading>>,
            'totalFiles': <<The total number of files to upload>>,
            'totalSize': <<Total size (In Bytes) of the submission (Submission JSON + All Files)>>,
            'uploaded': <<Total Bytes uploaded so far>>,
            'retryAttempts': <<The number of times the submission has tried to upload>>
       * }
       */
      self.submission.on("progress", function(progress){
        console.log("Submission Upload Progress: ", progress);
      });

      /**
       * An error occurred when uploading the submission
       */
      self.submission.on("error", function(err){
        self.trigger("error", err);
      });

      /**
       * An event emitted when the form submission has completed successfully.
       *
       * The "remoteSubmissionId" parameter is the submission Id of the submission in the database. This is useful when
       * searching for a submission.
       */
      self.submission.on("submitted", function(remoteSubmissionId){
        App.views.alertView.show("Submission Complete: " + remoteSubmissionId);

        //Emitting the complete event for this view. Any job listening for this event will mark itself as complete.
        self.trigger("complete", self.submission.getLocalId(), remoteSubmissionId);
      });

      App.views.alertView.show("Submitting Form To Verify Data");
      /**
       * Now that the submission has all of the values that are present in the form, the submission can now be
       * submitted to validate that the entire form is correct and ready for upload
       */
      self.submission.submit(function(err){
        if(err){
          //An error occurred when submitting
          //Note: the submission events above contain manage any errors that occur when uploading
          return;
        }

        App.views.alertView.show("Queueing Submission For Upload");

        self.submission.upload(function(err){
          if(err){
            //An error occurred when uploading
            return;
          }
        });
      });
    });
  },
  /**
   * Gathering all of the inputs values and applying them to the submission
   */
  saveFieldInputsToSubmission: function(cb){
    var self = this;
    var inputs = self.$el.find('input');

    /**
     * Submission "addInputValue" is an asynchronous function.
     * Therefore it is useful to use the 'async' library.
     */
    async.each(inputs, function(input, cb){
      input = $(input);
      var fieldId = input.data('fieldid');
      var index = input.data('index');
      var value = input.val();

      self.submission.addInputValue({
        fieldId: fieldId,
        value: value,
        index: index
      }, cb);
    }, cb);
  },
  /**
   * The reverse of saveFieldInputsToSubmission function.
   * This function populates the submission values to the form fields for editing.
   * @returns {*}
   */
  populateSubmissionValuesToForm: function(){
    var self = this;

    /**
     *
     * -- Local submissions for upload to a server have the structure
     * formFields: [
     *  {
     *    fieldId: <<ID OF FIELD>>,
     *    fieldValues: <<Array OF VALUES INPUT INTO THE FIELD>>
     *  }
     * ]
     *
     *
     * --- Downloaded submission have a field structure of
     *
     * formFields: [
     *  {
     *    fieldId: {
     *      _id: <<ID OF FIELD>>,
     *      type: <<type of the field>>
     *      ...
     *    },
     *    fieldValues: <<Array OF VALUES INPUT INTO THE FIELD>>
     *  }
     * ]
     * @type {*}
     */
    var formFields = self.submission.getFormFields();

    _.each(formFields, function(fieldData){
      var fieldId;

      if(self.submission.isDownloadSubmission()){
        fieldId = fieldData.fieldId._id;
      } else {
        fieldId = fieldData.fieldId;
      }

      var fieldValues = fieldData.fieldValues;

      self.$el.find('input[data-fieldid="' + fieldId + '"]').val(fieldValues[0]);
    });
  }
  /**
   * Populating a value to the submission.
   *
   * It is possible to assign values to the submission
   */
});