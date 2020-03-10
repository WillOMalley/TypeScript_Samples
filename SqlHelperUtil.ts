"Use Strict";
/*****************************************************************************************************************************************
 * Created by: Will O'Malley
 * Purpose: Help with the creation, clean-up and execution of sql statements
 * ---------------------------------------------------------------------------------------------------------------------------------------
 * NOTE:
 *
 * ---------------------------------------------------------------------------------------------------------------------------------------
 *  Maintenance Log:
 *
 *****************************************************************************************************************************************/
import * as $ from 'jquery';

import * as Globals from '../../../Globals';
/*****************************************************************************************
 * Below i'm importing my custom logger and setting some initial variables that will get
 * used below.
 * --------------------------------------------------------------------------------------
 * Custom Logger:
*****************************************************************************************/
import * as GroovyLogger from '../ApplicationLogging/GroovyConsoleLogger';
const AppMessageType = GroovyLogger.MessageType;
const AppErrorType = GroovyLogger.ErrorType;

export class SqlHelperUtil
{
  private _myGlobals: Globals.appGlobals;
  private _sqlStatement: string = "";

  constructor(globals: Globals.appGlobals)
  {
    this._myGlobals = globals;

    this.initializeComponent();
  }

  private initializeComponent(): void
  {

  }

/**************************************************************************************************************************
 * Use this method to generate the full Sql query statement that will be executed.
 * This method formats the SQL String and makes sure that the user isn't trying to perform an action that isn't allowed.
 * It also shapes the returned XML result allowing you to set both the ROOT and ROW element names.
 * For example:
 * If the rootElementName = ROOT and the rowElementName = ITEM you would the following would get returned:
 * <ROOT>
 *  <ITEM>
 *    ...
 *  </ITEM>
 *  <ITEM>
 *    ...
 *  </ITEM>
 *  <ITEM>
 *    ...
 *  </ITEM>
 * </ROOT>
 *
 * @param {string} database: This is the Database used to execute the query against.
 * @param {string} sql: This is the SQL String that will be executed against the specified database.
 * @param {boolean} allowSystemQuery: Do you want to allow queries against system objects?
 * @param {string} rootElementName: This will define the root node for the resulting XML string.
 * @param {string} rowElementName: This will define how the elements returned in the XML string.
 * @memberof SqlHelperUtil
 **************************************************************************************************************************/
  public BuildSqlStatement(database: string, sql: string, allowSystemQuery: boolean, rootElementName: string, rowElementName: string): void
  {
    this._sqlStatement = "";

    if (database == "" || database == undefined)
    {
      database = "master";
    }

    this._sqlStatement = `
          USE [${ database }];

          SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
          SET NOCOUNT ON;

          DECLARE @ErrorMessage VARCHAR(MAX);

          BEGIN TRY

            SELECT TOP ${ this._myGlobals.queryRowLimit == "" || this._myGlobals.queryRowLimit == undefined ? "100" : this._myGlobals.queryRowLimit }
            A1.*
            FROM
            (
             ${
                this.CleanSqlString(sql, allowSystemQuery)
              }
            ) AS A1
            FOR XML PATH('${ rowElementName }'), Elements, ROOT('${ rootElementName }');

          END TRY
          BEGIN CATCH

            DECLARE @NewLine CHAR(2);

            SET @NewLine = CHAR(13) + CHAR(10);

            SELECT @ErrorMessage = 'Error Number: ' + CONVERT(VARCHAR(50),ERROR_NUMBER()) + ' ' + @NewLine +
                                   'Error Line: ' + CONVERT(VARCHAR(50),ERROR_LINE()) + ' ' + @NewLine +
                                   'Error Message: ' + ERROR_MESSAGE();

            RAISERROR (@ErrorMessage, 16, 1);

          END CATCH;
    `;
  }

/**************************************************************************************************************************
 * Use this method to perform more complex queries.
 * This method formats the SQL String and makes sure that the user isn't trying to perform an action that isn't allowed.
 * It also shapes the returned XML result allowing you to set both the ROOT and ROW element names.
 * For example:
 * If the rootElementName = ROOT and the rowElementName = ITEM you would the following would get returned:
 * <ROOT>
 *  <ITEM>
 *    ...
 *  </ITEM>
 *  <ITEM>
 *    ...
 *  </ITEM>
 *  <ITEM>
 *    ...
 *  </ITEM>
 * </ROOT>
 *
 * @param {string} database: This is the Database used to execute the query against.
 * @param {string} sql: This is the SQL String that will be executed against the specified database.
 * @param {boolean} allowSystemQuery: Do you want to allow queries against system objects?
 * @param {string} rootElementName: This will define the root node for the resulting XML string.
 * @param {string} rowElementName: This will define how the elements returned in the XML string.
 * @memberof SqlHelperUtil
 **************************************************************************************************************************/
  public BuildComplexStatement(database: string, sql: string, allowSystemQuery: boolean, rootElementName: string, rowElementName: string): void
  {
    this._sqlStatement = "";

    if (database == "" || database == undefined)
    {
      database = "master";
    }

    this._sqlStatement = `
          USE [${ database }];

          SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
          SET NOCOUNT ON;

          DECLARE @ErrorMessage VARCHAR(MAX);

          BEGIN TRY

            SELECT TOP ${ this._myGlobals.queryRowLimit == "" || this._myGlobals.queryRowLimit == undefined ? "100" : this._myGlobals.queryRowLimit }
            A1.*
            FROM
            (
             ${
                this.CleanSqlString(sql, allowSystemQuery)
              }
            ) AS A1
            FOR XML PATH('${ rowElementName }'), Elements, ROOT('${ rootElementName }');

          END TRY
          BEGIN CATCH

            DECLARE @NewLine CHAR(2);

            SET @NewLine = CHAR(13) + CHAR(10);

            SELECT @ErrorMessage = 'Error Number: ' + CONVERT(VARCHAR(50),ERROR_NUMBER()) + ' ' + @NewLine +
                                   'Error Line: ' + CONVERT(VARCHAR(50),ERROR_LINE()) + ' ' + @NewLine +
                                   'Error Message: ' + ERROR_MESSAGE();

            RAISERROR (@ErrorMessage, 16, 1);

          END CATCH;
    `;
  }

/**************************************************************************************************************************
 * Use this method to execute your query after calling the BuildSqlStatement method.
 * This method uses JQuery to execute an Ajax call to the Web Service API that actually executes the query.
 * The Web Service API Url is constructed using the values set by the user in the Web Part Property Pane during setup.
 *
 * @returns JQuery jqXHR object
 * For more info:
 *  JQuery Ajax API: https://api.jquery.com/jquery.ajax/
 *  JQuery Deferred Object (jqXHR): https://api.jquery.com/category/deferred-object/
 * The jqXHR object returns a Promise interface which will provide amongst other things a then(able) object.
 *
 * @memberof SqlHelperUtil
 **************************************************************************************************************************/
  public ExecuteQuery(): any
  {
    // Generate the Connection string:
    // this.GenerateConnectionString();
    //
    // Now we can send the request to the Web Service API.
    // For more info:
    // https://api.jquery.com/jquery.ajax/
    // https://api.jquery.com/jQuery.parseXML/
    //

    var jqXhr = $.ajax({
      type: 'POST',
      url: this._myGlobals.webServiceAPIUrl,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(this.GenerateConnectionString())
    });

    return jqXhr;
  }

  private GenerateConnectionString(): any
  {
    return {
            "WindowsUserName": (this._myGlobals.currentUserLoginName.length < 1 ? this._myGlobals.sqlServerLoginUserName : this._myGlobals.currentUserLoginName),
            "SqlServerName": this._myGlobals.sqlServerName,
            "SqlServerInstanceName": this._myGlobals.sqlServerInstanceName,
            "SqlServerPort": this._myGlobals.sqlServerPort,
            "UseSqlServerAuthentication": this._myGlobals.useSqlServerAuthentication,
            "UseWindowsAuthentication": this._myGlobals.useWindowsAuthentication,
            "UseAzureEncryption": this._myGlobals.useAzureEncryption,
            "UseTrustedConnection": this._myGlobals.useWindowsAuthentication,
            "UseNamedInstance": this._myGlobals.useNamedInstance,
            "SqlServerLoginUserName": this._myGlobals.sqlServerLoginUserName,
            "SqlServerLoginPassword": this._myGlobals.sqlServerLoginPassword,
            "SqlQuery": this._sqlStatement
          };
  }

  private CleanSqlString(sql: string, allowSystemQuery: boolean): string
  {
    var returnValue: string;

    /***************************************************************************
     * Here we need to check and make sure someone isn't trying to modify data.
     * This includes INSERT, UPDATE and DELETE statements against physical tables.
     ***************************************************************************/
    returnValue = sql;

    if (!allowSystemQuery && (returnValue.toLowerCase().indexOf("sys.") > 0 || returnValue.toLowerCase().indexOf("information_schema") > 0))
    {
      returnValue = "SELECT 'You are not allowed to perform system level queries using this application.' AS MESSAGE";
    }
    else if (!allowSystemQuery && (returnValue.toLowerCase().indexOf("master") > 0 ||
                                   returnValue.toLowerCase().indexOf("model") > 0 ||
                                   returnValue.toLowerCase().indexOf("msdb") > 0 ||
                                   returnValue.toLowerCase().indexOf("reportserver") > 0))
    {
      returnValue = "SELECT 'You are not allowed to query system databases using this application.' AS MESSAGE";
    }
    else
    {
      // Because this query gets wrapped inside another query we need to take care of the order by if it exists.
      if (returnValue.toLowerCase().indexOf('order by') > 0)
      {
        returnValue = sql.replace('SELECT', 'SELECT TOP 100 PERCENT ');
      }
      else
      {
        returnValue = sql;
      }

    }

    return returnValue;
  }

}
