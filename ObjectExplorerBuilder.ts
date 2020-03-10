"Use Strict";
/*****************************************************************************************************************************************
 * Created by: Will O'Malley
 * Purpose: Used to generate the HTML for the Object Explorer and handle any events.
 * ---------------------------------------------------------------------------------------------------------------------------------------
 * NOTE:
 *  This file contains references to Global Variables that have been defined in ./src/webparts/sqlconnectorWebpart/environment/Global
 * ---------------------------------------------------------------------------------------------------------------------------------------
 *  Maintenance Log:
 *
 *****************************************************************************************************************************************/
import * as $ from 'jquery';

/************************************************************************************************
 * This Web Part has a Form that users will use to enter the connection information.
 * This information will be used in several places so, I've created some variables to hold the info.
************************************************************************************************/
import * as Globals from '../../../Globals';
import * as styles from './ObjectExplorerBuilder.module.scss';

/*****************************************************************************************
 * Below i'm importing my custom logger and setting some initial variables that will get
 * used below.
 * --------------------------------------------------------------------------------------
 * Custom Logger:
*****************************************************************************************/
import * as GroovyLogger from '../ApplicationLogging/GroovyConsoleLogger';
const AppMessageType = GroovyLogger.MessageType;
const AppErrorType = GroovyLogger.ErrorType;

import * as AppDialog from '../DialogWindows/ConnectionFormDialog/ConnectionFormDialog';

import * as Listeners from './ObjectExplorerEventListeners';

export class ObjectExplorerBuilder
{
  //#region Images:

  /*****************************************************************************************
   * In order to reference images correctly a change was made to gulpfile.js
   * if you would like to see how I did this please reference the above file.
   * --------------------------------------------------------------------------------------
   * Custom Images Import(s).
  *****************************************************************************************/
  private _ObjectExplorerToolBarNewQueryIcon: any = require('../../../images/NewQuery.png');
  private _ObjectExplorerDatabaseIcon: any = require('../../../images/DatabaseIcon_White.png');
  private _ObjectExplorerDatabaseOfflineIcon: any = require('../../../images/DatabaseIcon_Offline_White2.png');
  private _ObjectExplorerClosedFolderIcon: any = require('../../../images/FolderIcon.png');
  private _ObjectExplorerOpenFolderIcon: any = require('../../../images/OpenFolder.jpg');
  private _ObjectExplorerExpandIcon: any = require('../../../images/ExpandIcon.png');
  private _ObjectExplorerCollapseIcon: any = require('../../../images/CollapseIcon.png');
  private _ObjectExplorerTableIcon: any = require('../../../images/TableIcon.png');
  private _ObjectExplorerViewIcon: any = require('../../../images/ViewIcon.png');
  private _ObjectExplorerItemPKColumnIcon: any = require('../../../images/PKColumn.png');
  private _ObjectExplorerItemFKColumnIcon: any = require('../../../images/FKColumn.png');
  private _ObjectExplorerItemColumnIcon: any = require('../../../images/RegularColumn.png');
  private _ObjectExplorerItemComputedColumnIcon: any = require('../../../images/ComputedColumn.png');

  //#endregion

  //#region Private Variables:

  private _myGlobals: Globals.appGlobals;
  private _myListeners: Listeners.WebFormEventListeners;
  private _connectionFormDialog: AppDialog.ConnectionFormDialog;
  private _uniqueNameQualifier: string = '|';

  //#endregion

  //#region Public Properties
  public get WebServiceURL(): string
  {
    return this._myGlobals.webServiceAPIUrl;
  }
  public set WebServiceURL(value: string)
  {
    this._myGlobals.webServiceAPIUrl = value;
  }

  public get ConnectionFormDialog(): AppDialog.ConnectionFormDialog
  {
    return this._connectionFormDialog;
  }
  //#endregion

  constructor(globals: Globals.appGlobals)
  {
    this._myGlobals = globals;

    this.InitializeComponent();
  }

  private InitializeComponent(): void
  {
    this._myListeners = new Listeners.WebFormEventListeners(this._myGlobals);
    this._connectionFormDialog = new AppDialog.ConnectionFormDialog(this._myGlobals);
  }

  //#region Public Methods

  public Render(): string
  {
    var docInnerHtml: string = "";

    // Generate HTML:
    docInnerHtml = `
    ${
      this._connectionFormDialog.render()
     }
    <TABLE ID="tblSqlServerPortWarning" CELLPADDING="0" CELLSPACING="0" BORDER="0" class="${ styles.default.WarningLabelContainer }">
      <TR>
        <TD>
          <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0" style="width: 100%; background: transparent;">
            <TR>
              <TD class="${ styles.default.WarningLabel_TableHeader }" align="center">
                <FONT color="white"><B>!!Attention:</B></FONT> The following error has occured:
              </TD>
              <TD ID="tdSqlServerPortWarning_CloseWindow" class="${ styles.default.WarningLabel_CloseIcon }">
                <B>X</B>
              </TD>
            </TR>
          </TABLE>
        </TD>
      </TR>
      <TR>
        <TD style="padding:5px;">
          <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0" class="${ styles.default.WarningLabelMessage_Table }">
            <TR>
              <TD class="${ styles.default.WarningLabel }" STYLE="padding-left:5px;">
              *
              </TD>
              <TD class="${ styles.default.WarningLabel }">
                The value for SQL Server Port <B>must</B> be a number.
              </TD>
            </TR>
          </TABLE>
        </TD>
      </TR>
    </TABLE>

    <TABLE CELLPADDING="1" CELLSPACING="0" BORDER="0">
      <TR>
        <TD Class="${ styles.default.LeftSidePanelHolder }">
          <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0" Class="${ styles.default.ConnectButtonContainer }">
            <TR>
                <TD align="center">
                    <BUTTON ID="cmdConnect" Class="${ styles.default.ConnectButton }">
                      Click here to Connect!
                    </BUTTON>
                </TD>
            </TR>
          </TABLE>
        </TD>
      </TR>
      <TR>
        <TD ID="tdObjectExplorerHolder" Class="${ styles.default.ObjectExplorerContainer }">
          ${
             this.GenerateObjectExplorer()
           }
        </TD>
      </TR>
    </TABLE>
    `;

    return docInnerHtml;
  }

  public SetConnectionButtonDisplayMode(webServiceUrl: string): void
  {
    var connectButton = $("#cmdConnect");

    if (webServiceUrl.length < 5)
    {
      connectButton.attr('disabled', 'disabled');
    }
    else
    {
      connectButton.removeAttr("disabled");
    }
  }

  /**
   * Use this method to add the initial Web Form Event handlers.
   * Currently called by: SqlconnectorWebpartWebPart.ts: render()
   *
   * @memberof ObjectExplorerBuilder
   */
  public AddConnectionWizardWebFormListeners(): void
  {

    this._connectionFormDialog.InitializeFormButtons();
    this._connectionFormDialog.AttachListeners();

    try
    {
      document.getElementById('cmdConnect').removeEventListener('click', () => this.ShowConnectionDialog());
    }
    catch (error)
    {
      // I don't care if it fails...
    }
    finally
    {
      document.getElementById('cmdConnect').addEventListener('click', () => this.ShowConnectionDialog());
    }

  }

  //#endregion

  //#region Private Methods
  private ShowConnectionDialog(): void
  {
    // Show the form so it's part of the DOM tree
    this._connectionFormDialog.ShowConnectionForm(document.getElementById('cmdConnect'));

    // Now we can reference the controls on the form.
    this._connectionFormDialog.InitializeFormButtons();
    this._connectionFormDialog.AttachListeners();

    try
    {
      this._connectionFormDialog.cmdConnectButton.removeEventListener('click', () => this.ConnectionWizardDataSubmit());
      this._connectionFormDialog.cmdCancelButton.removeEventListener('click', () => this.ConnectionWizardCancelSubmit());
    }
    catch (error)
    {
      // I don't care if it fails...
    }
    finally
    {
      this._connectionFormDialog.cmdConnectButton.addEventListener('click', () => this.ConnectionWizardDataSubmit());
      this._connectionFormDialog.cmdCancelButton.addEventListener('click', () => this.ConnectionWizardCancelSubmit());
    }

    document.getElementById('tdSqlServerPortWarning_CloseWindow').addEventListener('click', (e: MouseEvent) => this.ToggleErrorWindow(e));
  }

  private ToggleErrorWindow(ev: MouseEvent): void
  {
    var item: HTMLElement = document.getElementById('tblSqlServerPortWarning');

    if (item.style.display.toLowerCase() == "block")
    {
      item.style.display = "none";
    }
  }

  private GenerateObjectExplorer(): string
  {
    return `
      <TABLE ID="tblObjectExplorerPane" CELLPADDING="0" CELLSPACING="0" BORDER="0" Class="${ styles.default.ObjectExplorer }">
        <TR>
          <TD>
            <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0" Class="${ styles.default.ObjectExplorerContentWellToolbar }">
              <TR>
                <TD>
                  <DIV>
                    <BUTTON ID="btnNewQuery" Class="${ styles.default.IconHolder }" STYLE="display: none;">
                      <IMG ID="imgNewQuery" SRC="${ this._ObjectExplorerToolBarNewQueryIcon }" STYLE="padding-top: 3px;"/>
                    </BUTTON>
                  </DIV>
                </TD>
              </TR>
            </TABLE>
          </TD>
        </TR>
        <TR>
          <TD ID="tdObjectExplorerContentWell" Class="${ styles.default.ObjectExplorerContentWell }">

          </TD>
        </TR>
      </TABLE>
    `;
  }

  private ConnectionWizardDataSubmit(): void
  {
    // First let's save our values:
    this._connectionFormDialog.SaveConnectionFormValues();

    // Now generate the database list for the server we connected to:
    this.GenerateServerDatabaseList();
  }

  private ConnectionWizardCancelSubmit(): any
  {
    // Clear out our variables:
    this._connectionFormDialog.ResetFormValues();

    // Hide the form:
    this._connectionFormDialog.HideConnectionForm();
  }

  private GenerateServerDatabaseList(): void
  {
    // now we can use our custom handler:
    let log = new GroovyLogger.GroovyConsoleLogger();
    log.File = "environment/ObjectExplorer/ObjectExplorerBuilder.ts";
    log.Method = "GenerateServerDatabaseList";
    log.MethodLineRange = "489 - 634";

    // Generate the header:
    log.BuildMessageHeader();

    // Hide the connection Form:
    this._connectionFormDialog.HideConnectionForm();

    // Overwrite the contents of our Div:
    document.getElementById("tdObjectExplorerContentWell").innerHTML = ``;

    // Show our Spinner:
    this._myGlobals.ProgressSpinner.SetProgressSpinnerPosition(document.getElementById("tdObjectExplorerContentWell"));
    this._myGlobals.ProgressSpinner.SendProgressSpinnerMessage("Connecting to " + this._myGlobals.sqlServerName + "...");
    this._myGlobals.ProgressSpinner.ShowProgressSpinner();

    try
    {
      var xmlData: string = "";
      var xmlDoc: XMLDocument;
      var htmlString: string = "";
      var ObjectList: string[] = [];

      // an XML string is returned from our SQL Query
      var value: any = this._myListeners.ConnectionWizardDataSubmit();

      // Walk through the result:
      value.done((data) =>
      {
        xmlData = data;
        xmlDoc = $.parseXML(xmlData);

        htmlString = `<TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">`;

        $(xmlDoc).find("DATABASE").each((index, item) =>
        {
          var dbid: string = $(item).find('DatabaseId').text();
          var dbname: string = $(item).find('DatabaseName').text();
          var dbstatus: string = $(item).find('DatabaseStatus').text();
          var tooltip: string = $(item).find('DatabaseCollation').text();

          htmlString += `
          <TR>
            <TD>
              <TABLE Class="${styles.default.ObjectExplorerTableStyle }" CELLPADDING="0" CELLSPACING="0">

                <TR title="Database Collation: ${ dbstatus.toLowerCase() == "offline" ? "Unknown" : tooltip }">
                  <TD>
                    <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
                      <TR>
                        <TD WIDTH="30px" ALIGN="CENTER">
                          <IMG CLASS="${ styles.default.ObjectExplorerTableImageStyle }" ID="imgDBS${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]" SRC="${ this._ObjectExplorerExpandIcon }" OBJECTTYPE="DATABASE" />
                        </TD>
                        <TD WIDTH="30px" ALIGN="CENTER">
                          <IMG CLASS="${ styles.default.ObjectExplorerTableImageStyle }" ID="imgDBS${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }DB" SRC="${ dbstatus.toLowerCase() == "offline" ? this._ObjectExplorerDatabaseOfflineIcon : this._ObjectExplorerDatabaseIcon }" />
                        </TD>
                        <TD WIDTH="250px" ALIGN="LEFT" Class="${ styles.default.ObjectExplorerChildTableItemStyle }">
                            ${ dbstatus.toLowerCase() == "offline" ? dbname + '(<FONT COLOR="RED"><I>Offline</I></FONT>)' : dbname }
                        </TD>
                      </TR>
                    </TABLE>
                  </TD>
                </TR>

                <TR ID="trTablesContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]" Class="${ styles.default.ObjectExplorerChildRowStyle }">
                  <TD colspan="0" STYLE="padding-left: 15px;">
                    <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
                      <TR>
                        <TD WIDTH="28px" ALIGN="LEFT">
                          <IMG CLASS="${ styles.default.ObjectExplorerTableImageStyle }" ID="imgTBLSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]" SRC="${ this._ObjectExplorerExpandIcon }" OBJECTTYPE="TABLES_FOLDER" TARGET="dvTablesContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }TableList"/>
                        </TD>
                        <TD WIDTH="22px" ALIGN="LEFT">
                          <IMG STYLE="width:19px; height:18px; vertical-align: middle;" ID="imgTBLSFLDR${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }FLDR" SRC="${ this._ObjectExplorerClosedFolderIcon }" />
                        </TD>
                        <TD ALIGN="LEFT">
                          <DIV Class="${ styles.default.ObjectExplorerChildTableItemStyle }">
                            Tables
                          </DIV>
                        </TD>
                      </TR>
                    </TABLE>
                  </TD>
                </TR>

                <TR ID="trTablesContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }TableList" Class="${ styles.default.ObjectExplorerChildRowStyle }">
                  <TD ID="dvTablesContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }TableList" COLSPAN="0" STYLE="padding-left: 30px;">
                  </TD>
                </TR>

                <TR ID="trViewsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]" Class="${ styles.default.ObjectExplorerChildRowStyle }">
                  <TD colspan="0" STYLE="padding-left: 15px;">
                    <TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">
                      <TR>
                        <TD WIDTH="28px" ALIGN="LEFT">
                          <IMG CLASS="${ styles.default.ObjectExplorerTableImageStyle }" ID="imgVWSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]" SRC="${ this._ObjectExplorerExpandIcon }" OBJECTTYPE="VIEWS_FOLDER" TARGET="dvViewsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }ViewList"/>
                        </TD>
                        <TD WIDTH="22px" ALIGN="LEFT">
                          <IMG STYLE="width:19px; height:18px; vertical-align: middle;" ID="imgVWSFLDR${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }FLDR" SRC="${ this._ObjectExplorerClosedFolderIcon }" />
                        </TD>
                        <TD ALIGN="LEFT">
                          <DIV Class="${ styles.default.ObjectExplorerChildTableItemStyle }">
                            Views
                          </DIV>
                        </TD>
                      </TR>
                    </TABLE>
                  </TD>
                </TR>

                <TR ID="trViewsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }ViewList">
                  <TD ID="dvViewsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }ViewList" COLSPAN="0" STYLE="padding-left: 30px;">
                  </TD>
                </TR>

              </TABLE>
            </TD>
          </TR>
          `;

          // We are going to use this to add event listeners:
          ObjectList.push(`imgDBS${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`);
          ObjectList.push(`imgTBLSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`);
          ObjectList.push(`imgVWSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`);

          // add to the global list:
          this._myGlobals.databaseList.push(dbname);
        });

        htmlString += `</TABLE>`;

        // Overwrite the contents of our Div:
        document.getElementById("tdObjectExplorerContentWell").innerHTML = htmlString;

        // Add our Event Listeners:
        ObjectList.forEach((item, index) =>
        {
          document.getElementById(item).addEventListener("click", () => this.ExpandObjectExplorerItem(document.getElementById(item)));
        });

        // Now that we have our Database list, we can enable the New Query button:
        document.getElementById("btnNewQuery").style.display = "block";

      });
    }
    catch (error)
    {
      alert("An error has been encountered in GenerateServerDatabaseList! " + error);

      // Append our error:
      log.AppendLogMessage(AppMessageType.ErrorMsg, AppErrorType.GenericError, error, "492 - 623");
    }
    finally
    {
      // Hide the Loading animation:
      setTimeout(() =>
      {
        this._myGlobals.ProgressSpinner.HideProgressSpinner(document.getElementById("tdObjectExplorerContentWell"));
      }, 5000);
    }

    // Generate the footer:
    log.BuildMessageFooter();

    // finally, generate the log entry:
    log.GenerateLog(true);

    // release from memory:
    log = null;
  }

  private ExpandObjectExplorerItem(UIElement: HTMLElement): void
  {
    var UniqueObjectIdentityfitiers: string[] = UIElement.id.split(this._uniqueNameQualifier);
    var dbid: string = UniqueObjectIdentityfitiers[1].replace('[', '').replace(']', '');
    var dbname: string = UniqueObjectIdentityfitiers[2].replace('[', '').replace(']', '');

    var ObjectType: string = UIElement.attributes["OBJECTTYPE"].value;
    var Container: HTMLElement;
    var Target: HTMLElement;

    switch (ObjectType)
    {
      case "DATABASE":
        // Hide or Show the Tables and Views folder:
        if (UIElement.attributes["SRC"].value.toString().toLowerCase().indexOf("expand") > 0)
        {
          // Change the Image from + to -
          UIElement.attributes["SRC"].value = this._ObjectExplorerCollapseIcon;

          // reset the folder icons for the Tables and Views folders
          document.getElementById(`imgTBLSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }FLDR`).attributes["SRC"].value = this._ObjectExplorerClosedFolderIcon;
          document.getElementById(`imgVWSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }FLDR`).attributes["SRC"].value = this._ObjectExplorerClosedFolderIcon;

          // reset the expand icon for the Tables and Views folders
          document.getElementById(`imgTBLSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`).attributes["SRC"].value = this._ObjectExplorerExpandIcon;
          document.getElementById(`imgVWSFLDR${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`).attributes["SRC"].value = this._ObjectExplorerExpandIcon;

          // Display the Tables and Views Folders for the given database
          document.getElementById(`trTablesContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`).style.display = "block";
          document.getElementById(`trViewsContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`).style.display = "block";
        }
        else
        {
          // Change the Image from - to +
          UIElement.attributes["SRC"].value = this._ObjectExplorerExpandIcon;

          // Get rid of the children for the Target passed in
          this.CollapseDatabase(document.getElementById(`dvTablesContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }TableList`));
          this.CollapseDatabase(document.getElementById(`dvViewsContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }ViewList`));

          // Hide the Tables and Views Folders for the given database
          document.getElementById(`trTablesContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`).style.display = "none";
          document.getElementById(`trViewsContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]`).style.display = "none";
        }
        break;

      case "TABLES_FOLDER":
        Container = document.getElementById(`trTablesContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }TableList`);
        Target = document.getElementById(`dvTablesContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }TableList`);

        // Hide or Show the tables for the selected database.
        if (UIElement.attributes["SRC"].value.toString().toLowerCase().indexOf("expand") > 0)
        {
          // Populate table list:
          this.ExpandTablesFolder(UIElement, Container, Target);
          UIElement.attributes["SRC"].value = this._ObjectExplorerCollapseIcon;
          // Change the folder icon:
          document.getElementById(UIElement.id + this._uniqueNameQualifier + 'FLDR').attributes["SRC"].value = this._ObjectExplorerOpenFolderIcon;
        }
        else
        {
          // Empty table list
          this.CollapseElement(Container, Target);
          UIElement.attributes["SRC"].value = this._ObjectExplorerExpandIcon;
          // Change the folder icon:
          document.getElementById(UIElement.id + this._uniqueNameQualifier + 'FLDR').attributes["SRC"].value = this._ObjectExplorerClosedFolderIcon;
        }

        break;

      case "VIEWS_FOLDER":
        Container = document.getElementById(`trViewsContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }ViewList`);
        Target = document.getElementById(`dvViewsContainerRow${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }ViewList`);

        // Hide or show the Views for the selected database.
        if (UIElement.attributes["SRC"].value.toString().toLowerCase().indexOf("expand") > 0)
        {
          // Populate view list
          this.ExpandViewsFolder(UIElement, Container, Target);
          UIElement.attributes["SRC"].value = this._ObjectExplorerCollapseIcon;
          // Change the folder icon:
          document.getElementById(UIElement.id + this._uniqueNameQualifier + 'FLDR').attributes["SRC"].value = this._ObjectExplorerOpenFolderIcon;
        }
        else
        {
          // Empty view list
          this.CollapseElement(Container, Target);
          UIElement.attributes["SRC"].value = this._ObjectExplorerExpandIcon;
          // Change the folder icon:
          document.getElementById(UIElement.id + this._uniqueNameQualifier + 'FLDR').attributes["SRC"].value = this._ObjectExplorerClosedFolderIcon;
        }

        break;
    }
  }

  private ExpandTablesFolder(UIElement: HTMLElement, Container: HTMLElement, Target: HTMLElement): void
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    log.File = "environment/ObjectExplorer/ObjectExplorerBuilder.ts";
    log.Method = "ExpandTablesFolder";
    log.MethodLineRange = "721 - 834";

    // Generate the header:
    log.BuildMessageHeader();

    // Show our Spinner:
    this._myGlobals.ProgressSpinner.SetProgressSpinnerPosition(document.getElementById("tdObjectExplorerContentWell"));
    this._myGlobals.ProgressSpinner.ShowProgressSpinner();

    try
    {
      var UniqueObjectIdentityfitiers: string[] = UIElement.id.split(this._uniqueNameQualifier);
      var xmlData: string = "";
      var xmlDoc: XMLDocument;
      var htmlString: string = "";
      var dbid: string = UniqueObjectIdentityfitiers[1].replace('[', '').replace(']', '');
      var dbname: string = UniqueObjectIdentityfitiers[2].replace('[', '').replace(']', '');
      var ObjectList: string[] = [];

      // Spinner Message:
      this._myGlobals.ProgressSpinner.SendProgressSpinnerMessage("Loading Tables for " + dbname);

      // an XML string is returned from our SQL Query
      var value: any = this._myListeners.ExpandTablesFolder(dbname);

      value.done((data) =>
      {
        xmlData = data;
        xmlDoc = $.parseXML(xmlData);

        htmlString = `<TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">`;

        $(xmlDoc).find("TABLE").each((index, item) =>
        {
          var dbObjectName: string = $(item).find('DatabaseObjectName').text();
          var dbObjectSchema: string = $(item).find('DatabaseObjectSchemaName').text();
          var dbObjectFullName: string = $(item).find('FullyQualifiedDatabaseObjectName').text();
          var dbObjectId: string = $(item).find('DatabaseObjectId').text();

          htmlString += `
            <TR>
              <TD>
                <TABLE Class="${styles.default.ObjectExplorerChildTableStyle }" CELLPADDING="0" CELLSPACING="0" BORDER="0" STYLE="padding-left:25px;">
                  <TR>
                    <TD COLSPAN="0">
                      <TABLE Class="${styles.default.ObjectExplorerChildTableStyle }" CELLPADDING="0" CELLSPACING="0" BORDER="0">
                        <TR>
                          <TD WIDTH="25px" ALIGN="CENTER">
                            <IMG ID="imgDBSTBL${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }Item" SRC="${ this._ObjectExplorerExpandIcon }" Class="${ styles.default.ObjectExplorerTableImageStyle }" OBJECTTYPE="TABLE" SCHEMA="${ dbObjectSchema }" />
                          </TD>
                          <TD WIDTH="20px" ALIGN="CENTER">
                            <IMG SRC="${ this._ObjectExplorerTableIcon }" STYLE="width: 15px;height: 15px;padding: 0px;margin: 0px;vertical-align: middle;" />
                          </TD>
                          <TD WIDTH="250px" ALIGN="LEFT" Class="${ styles.default.ObjectExplorerChildTableItemStyle }">
                              ${ dbObjectSchema + '.' + dbObjectName }
                          </TD>
                        </TR>
                      </TABLE>
                    </TD>
                  </TR>
                  <TR ID="trTableColumnsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }TableItem" Class="${ styles.default.ObjectExplorerChildRowStyle }">
                    <TD COLSPAN="0" WIDTH="100%">
                      <DIV ID="dvTableColumnsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }TableItemColumnList">
                      </DIV>
                    </TD>
                  </TR>
                </TABLE>
              </TD>
            </TR>
          `;

          // We are going to use this to add event listeners:
          ObjectList.push(`imgDBSTBL${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }Item`);

        });

        htmlString += `</TABLE>`;

        // Overwrite the contents of our Div:
        Target.innerHTML = htmlString;

        // Add our Event Listeners:
        ObjectList.forEach((item, index) =>
        {
          let myContainer: HTMLElement = document.getElementById(item.replace('imgDBSTBL', 'trTableColumnsContainerRow').replace('Item', 'TableItem'));
          let myTarget: HTMLElement = document.getElementById(item.replace('imgDBSTBL', 'dvTableColumnsContainerRow').replace('Item', 'TableItemColumnList'));

          document.getElementById(item).addEventListener("click", () => this.ExpandTable(document.getElementById(item), myContainer, myTarget));
        });

        // Now show our div
        Container.style.display = "block";

      });
    }
    catch (error)
    {
      // Append our error:
      log.AppendLogMessage(AppMessageType.ErrorMsg, AppErrorType.GenericError, error, "1089 - 1134");
    }
    finally
    {
      // Hide the Progress spinner:
      setTimeout(() =>
      {
        this._myGlobals.ProgressSpinner.HideProgressSpinner(document.getElementById("tdObjectExplorerContentWell"));
      }, 5000);

    }
    // Generate the footer:
    log.BuildMessageFooter();

    // finally, generate the log entry:
    log.GenerateLog(true);

    // release from memory:
    log = null;
  }

  private ExpandViewsFolder(UIElement: HTMLElement, Container: HTMLElement, Target: HTMLElement): void
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    log.File = "environment/ObjectExplorer/ObjectExplorerBuilder.ts";
    log.Method = "ExpandViewsFolder";
    log.MethodLineRange = "836 - 950";

    // Generate the header:
    log.BuildMessageHeader();

    // Show our Spinner:
    this._myGlobals.ProgressSpinner.SetProgressSpinnerPosition(document.getElementById("tdObjectExplorerContentWell"));
    this._myGlobals.ProgressSpinner.ShowProgressSpinner();

    try
    {
      var UniqueObjectIdentityfitiers: string[] = UIElement.id.split(this._uniqueNameQualifier);
      var xmlData: string = "";
      var xmlDoc: XMLDocument;
      var htmlString: string = "";
      var dbid: string = UniqueObjectIdentityfitiers[1].replace('[', '').replace(']', '');
      var dbname: string = UniqueObjectIdentityfitiers[2].replace('[', '').replace(']', '');
      var ObjectList: string[] = [];

      // Spinner Message:
      this._myGlobals.ProgressSpinner.SendProgressSpinnerMessage("Loading Views for " + dbname);

      // an XML string is returned from our SQL Query
      var value: any = this._myListeners.ExpandViewsFolder(dbname);

      value.done((data) =>
      {
        xmlData = data;
        xmlDoc = $.parseXML(xmlData);

        htmlString = `<TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0">`;

        $(xmlDoc).find("VIEW").each((index, item) =>
        {
          var dbObjectName: string = $(item).find('DatabaseObjectName').text();
          var dbObjectSchema: string = $(item).find('DatabaseObjectSchemaName').text();
          var dbObjectFullName: string = $(item).find('FullyQualifiedDatabaseObjectName').text();
          var dbObjectId: string = $(item).find('DatabaseObjectId').text();

          htmlString += `
            <TR>
              <TD>
                <TABLE Class="${ styles.default.ObjectExplorerTableStyle }" CELLPADDING="0" CELLSPACING="0" BORDER="0" STYLE="padding-left:25px;">

                  <TR>
                    <TD COLSPAN="0">
                      <TABLE Class="${styles.default.ObjectExplorerChildTableStyle }" CELLPADDING="0" CELLSPACING="0" BORDER="0">
                        <TR>
                          <TD WIDTH="25px" ALIGN="CENTER">
                            <IMG ID="imgDBVWS${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }Item" SRC="${ this._ObjectExplorerExpandIcon }" Class="${ styles.default.ObjectExplorerTableImageStyle }" OBJECTTYPE="VIEW" SCHEMA="${ dbObjectSchema }" />
                          </TD>
                          <TD WIDTH="20px" ALIGN="CENTER">
                            <IMG SRC="${ this._ObjectExplorerViewIcon }" STYLE="width: 15px;height: 15px;padding: 0px;margin: 0px;vertical-align: middle;" />
                          </TD>
                          <TD WIDTH="250px" ALIGN="LEFT" Class="${ styles.default.ObjectExplorerChildTableItemStyle }">
                              ${ dbObjectSchema + '.' + dbObjectName }
                          </TD>
                        </TR>
                      </TABLE>
                    </TD>
                  </TR>

                  <TR ID="trViewsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }ViewItem" Class="${ styles.default.ObjectExplorerChildRowStyle }">
                    <TD COLSPAN="0" WIDTH="100%">
                      <DIV ID="dvViewsContainerRow${this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }ViewItemColumnList">
                      </DIV>
                    </TD>
                  </TR>

                </TABLE>
              </TD>
            </TR>
          `;

          // We are going to use this to add event listeners:
          ObjectList.push(`imgDBVWS${ this._uniqueNameQualifier }[${ dbid }]${ this._uniqueNameQualifier }[${ dbname }]${ this._uniqueNameQualifier }[${ dbObjectId }]${ this._uniqueNameQualifier }[${ dbObjectName }]${ this._uniqueNameQualifier }Item`);

        });

        htmlString += `</TABLE>`;

        // Overwrite the contents of our Div:
        Target.innerHTML = htmlString;

        // Add our Event Listeners:
        ObjectList.forEach((item, index) =>
        {
          let myContainer: HTMLElement = document.getElementById(item.replace('imgDBVWS', 'trViewsContainerRow').replace('Item', 'ViewItem'));
          let myTarget: HTMLElement = document.getElementById(item.replace('imgDBVWS', 'dvViewsContainerRow').replace('Item', 'ViewItemColumnList'));

          document.getElementById(item).addEventListener("click", () => this.ExpandView(document.getElementById(item), myContainer, myTarget));
        });

        // Now show our div
        Container.style.display = "block";
      });

    }
    catch (error)
    {
      // Append our error:
      log.AppendLogMessage(AppMessageType.ErrorMsg, AppErrorType.GenericError, error, "844 - 928");
    }
    finally
    {
      setTimeout(() =>
      {
        this._myGlobals.ProgressSpinner.HideProgressSpinner(document.getElementById("tdObjectExplorerContentWell"));
      }, 5000);
    }
    // Generate the footer:
    log.BuildMessageFooter();

    // finally, generate the log entry:
    log.GenerateLog(true);

    // release from memory:
    log = null;
  }

  private ExpandTable(UIElement: HTMLElement, Container: HTMLElement, Target: HTMLElement): void
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    log.File = "environment/ObjectExplorer/ObjectExplorerBuilder.ts";
    log.Method = "ExpandTable";
    log.MethodLineRange = "957 - 1054";

    // Generate the header:
    log.BuildMessageHeader();

    // Show our Spinner:
    this._myGlobals.ProgressSpinner.SetProgressSpinnerPosition(document.getElementById("tdObjectExplorerContentWell"));
    this._myGlobals.ProgressSpinner.ShowProgressSpinner();

    if (UIElement.attributes["SRC"].value.toString().toLowerCase().indexOf("expand") > 0)
    {
      UIElement.attributes["SRC"].value = this._ObjectExplorerCollapseIcon;
      Target.innerHTML = "";
    }
    else
    {
      UIElement.attributes["SRC"].value = this._ObjectExplorerExpandIcon;
      this.CollapseElement(Container, Target);
      return;
    }

    try
    {
      // an XML string is returned from our SQL Query
      var UniqueObjectIdentityfitiers: string[] = UIElement.id.split(this._uniqueNameQualifier);
      var xmlData: string = "";
      var xmlDoc: XMLDocument;
      var htmlString: string = "";
      var dbid: string = UniqueObjectIdentityfitiers[1].replace('[', '').replace(']', '');
      var dbname: string = UniqueObjectIdentityfitiers[2].replace('[', '').replace(']', '');
      var dbTableId: string = UniqueObjectIdentityfitiers[3].replace('[', '').replace(']', '');
      var dbTableName: string = UniqueObjectIdentityfitiers[4].replace('[', '').replace(']', '');
      var dbTableSchema: string = UIElement.attributes["SCHEMA"].value;

      // Spinner Message:
      this._myGlobals.ProgressSpinner.SendProgressSpinnerMessage("Loading Columns for " + dbTableSchema + "." + dbTableName);

      var value: any = this._myListeners.ExpandTable(dbname, dbTableSchema, dbTableName);

      value.done((data) =>
      {
        xmlData = data;
        xmlDoc = $.parseXML(xmlData);

        htmlString = `<TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0" STYLE="padding-left: 25px;"> `;

        $(xmlDoc).find("COLUMN").each((index, item) =>
        {
          var dbObjectName: string = $(item).find('ColumnDisplayName').text();
          var ColumnIsComputed = new Boolean($(item).find('ColumnIsComputed').text());
          var imageHTML: string = "";

          if (dbObjectName.indexOf('PK') > 0)
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemPKColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }
          else if (dbObjectName.indexOf('FK') > 0)
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemFKColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }
          else if (ColumnIsComputed)
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemComputedColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }
          else
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }

          htmlString += `
            <TR>
              <TD WIDTH="20px" ALIGN="CENTER">
                ${ imageHTML }
              </TD>
              <TD WIDTH="350px" ALIGN="LEFT" Class="${ styles.default.ObjectExplorerChildTableItemStyle }">
                ${ dbObjectName }
              </TD>
            </TR>
          `;

        });

        htmlString += `</TABLE>`;

        // Overwrite the contents of our Div:
        Target.innerHTML = htmlString;

        // Now show our div
        Container.style.display = "block";

      });
    }
    catch (error)
    {
      // Append our error:
      log.AppendLogMessage(AppMessageType.ErrorMsg, AppErrorType.GenericError, error, "971 - 1032");
    }
    finally
    {
      setTimeout(() =>
      {
        this._myGlobals.ProgressSpinner.HideProgressSpinner(document.getElementById("tdObjectExplorerContentWell"));
      }, 5000);
    }
    // Generate the footer:
    log.BuildMessageFooter();

    // finally, generate the log entry:
    log.GenerateLog(true);

    // release from memory:
    log = null;
  }

  private ExpandView(UIElement: HTMLElement, Container: HTMLElement, Target: HTMLElement): void
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    log.File = "environment/ObjectExplorer/ObjectExplorerBuilder.ts";
    log.Method = "ExpandView";
    log.MethodLineRange = "1058 - 1156";

    // Generate the header:
    log.BuildMessageHeader();

    // Show our Spinner:
    this._myGlobals.ProgressSpinner.SetProgressSpinnerPosition(document.getElementById("tdObjectExplorerContentWell"));
    this._myGlobals.ProgressSpinner.ShowProgressSpinner();

    if (UIElement.attributes["SRC"].value.toString().toLowerCase().indexOf("expand") > 0)
    {
      UIElement.attributes["SRC"].value = this._ObjectExplorerCollapseIcon;
      Target.innerHTML = "";
    }
    else
    {
      UIElement.attributes["SRC"].value = this._ObjectExplorerExpandIcon;
      this.CollapseElement(Container, Target);
      return;
    }

    try
    {
      // an XML string is returned from our SQL Query
      var UniqueObjectIdentityfitiers: string[] = UIElement.id.split(this._uniqueNameQualifier);
      var xmlData: string = "";
      var xmlDoc: XMLDocument;
      var htmlString: string = "";
      var dbid: string = UniqueObjectIdentityfitiers[1].replace('[', '').replace(']', '');
      var dbname: string = UniqueObjectIdentityfitiers[2].replace('[', '').replace(']', '');
      var dbViewId: string = UniqueObjectIdentityfitiers[3].replace('[', '').replace(']', '');
      var dbViewName: string = UniqueObjectIdentityfitiers[4].replace('[', '').replace(']', '');
      var dbViewSchema: string = UIElement.attributes["SCHEMA"].value;

      // Spinner Message:
      this._myGlobals.ProgressSpinner.SendProgressSpinnerMessage("Loading Columns for " + dbViewSchema + "." + dbViewName);

      var value: any = this._myListeners.ExpandView(dbname, dbViewSchema, dbViewName);

      value.done((data) =>
      {
        xmlData = data;
        xmlDoc = $.parseXML(xmlData);

        htmlString = `<TABLE CELLPADDING="0" CELLSPACING="0" BORDER="0" STYLE="padding-left:25px;">`;

        $(xmlDoc).find("COLUMN").each((index, item) =>
        {
          var dbObjectName: string = $(item).find('ColumnDisplayName').text();
          var ColumnIsComputed = new Boolean($(item).find('ColumnIsComputed').text());
          var imageHTML: string = "";

          if (dbObjectName.indexOf('PK') > 0)
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemPKColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }
          else if (dbObjectName.indexOf('FK') > 0)
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemFKColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }
          else if (ColumnIsComputed)
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemComputedColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }
          else
          {
            imageHTML = `<IMG SRC="${ this._ObjectExplorerItemColumnIcon }" Class="${ styles.default.ObjectExplorerKeyColumnItemStyle }" />`;
          }

          htmlString += `
            <TR>
              <TD WIDTH="20px" ALIGN="CENTER">
                ${ imageHTML }
              </TD>
              <TD WIDTH="350px" ALIGN="LEFT" Class="${ styles.default.ObjectExplorerChildTableItemStyle }" >
                ${ dbObjectName }
              </TD>
            </TR>
          `;

        });

        htmlString += `</TABLE>`;

        // Overwrite the contents of our Div:
        Target.innerHTML = htmlString;

        // Now show our div
        Container.style.display = "block";
      });
    }
    catch (error)
    {
      // Append our error:
      log.AppendLogMessage(AppMessageType.ErrorMsg, AppErrorType.GenericError, error, "1089 - 1134");
    }
    finally
    {
      setTimeout(() =>
      {
        this._myGlobals.ProgressSpinner.HideProgressSpinner(document.getElementById("tdObjectExplorerContentWell"));
      }, 5000);
    }
    // Generate the footer:
    log.BuildMessageFooter();

    // finally, generate the log entry:
    log.GenerateLog(true);

    // release from memory:
    log = null;
  }

  private CollapseElement(Container: HTMLElement, Target: HTMLElement): void
  {

    if (Target != undefined && Container != undefined)
    {

      // deal with any child elements:
      if (Target.children.length > 0)
      {
        // Create an array of the Targets child nodes:
        let TargetChildNodes = Array.from(Target.childNodes);

        for (let childNode of TargetChildNodes)
        {
          Target.removeChild(childNode);
        }

        // Empty our Array
        TargetChildNodes.length = 0;
      }

      // Overwrite the contents of the target:
      Target.innerHTML = ``;

      // Now hide the Container:
      Container.style.display = "none";
    }

  }

/**
 * Call this method when you are collapsing at the Database Level.
 * In the GenerateServerDatabaseList method a giant table is created that holds everything.
 * Here, for a given Database, we are passing in the Child Object that gets populated when
 * you expand the Tables or Views folder for a given database. This will allow us to remove
 * all of the child elements easily.
 *
 * @private
 *
 * @param {HTMLElement} Target: This is the Object being populated when you expand the Tables or Views folder
 * for a given Database.
 *
 * @memberof ObjectExplorerBuilder
 */
  private CollapseDatabase(Target: HTMLElement): void
  {
    // We could just set the innerHTML to blank but, I want to remove each child from the DOM.
    // My hope is, this will force a garbage collection and that will remove any of the dynamically created event listeners
    // that get generated.
    let TargetChildren = Array.from(Target.childNodes);

    // Get these kids OUT-A-HERE
    for (let child of TargetChildren)
    {
      // if this child has children, get rid of them:
      if (child.childNodes.length > 0)
      {
        let childsChildren = Array.from(child.childNodes);
        childsChildren.length = 0;
      }

      // Now, remove the child:
      Target.removeChild(child);
    }

    // Empty our Array:
    TargetChildren.length = 0;

    // Now, i'll reset the innerHTML
    Target.innerHTML = ``;
  }
  //#endregion
}
