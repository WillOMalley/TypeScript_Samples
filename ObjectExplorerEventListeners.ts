"Use Strict";
/*****************************************************************************************************************************************
 * Created by: Will O'Malley
 * Purpose: Handles events for ObjectExplorerBuilder.ts
 * ---------------------------------------------------------------------------------------------------------------------------------------
 * NOTE:
 *  This file contains references to Global Variables that have been defined in ./src/webparts/sqlconnectorWebpart/environment/Global
 * ---------------------------------------------------------------------------------------------------------------------------------------
 *  Maintenance Log:
 *
 *****************************************************************************************************************************************/
import * as SqlHelper from '../SqlHelper/SqlHelperUtil';
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

export class WebFormEventListeners
{
  private _myGlobals: Globals.appGlobals;
  private _mySqlHelper: SqlHelper.SqlHelperUtil;

  constructor(globals: Globals.appGlobals)
  {
    this._myGlobals = globals;

    this.initializeComponent();
  }

  private initializeComponent(): void
  {
    this._mySqlHelper = new SqlHelper.SqlHelperUtil(this._myGlobals);
  }

  
  public ConnectionWizardDataSubmit(): any
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    var execReturnValue: any;
    var sqlString: string;

    // setup our query string:
    sqlString = `
      SELECT
         @@SERVERNAME             AS ServerName
        ,SD.database_id		        AS DatabaseId
        ,LTRIM(RTRIM(SD.[name]))  AS DatabaseName
        ,SD.collation_name	      AS DatabaseCollation
        ,SD.state_desc            AS DatabaseStatus
      FROM sys.databases AS SD
      WHERE SD.[name] NOT IN ('master','tempdb','model','msdb','ReportServer','ReportServerTempDB')
      ORDER BY QUOTENAME(LTRIM(RTRIM(UPPER(SD.[name])))) ASC
      `;

    // generate the fully formatted sql statement:
    this._mySqlHelper.BuildSqlStatement("master", sqlString, true, 'DATABASES', 'DATABASE');

    // execute the sql statement:
    execReturnValue = this._mySqlHelper.ExecuteQuery();
    return execReturnValue;
  }

  public ExpandTablesFolder(ObjectName: string): any
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    var execReturnValue: any;
    var sqlString: string;

    // setup our query string:
    sqlString = `
      SELECT
         CONVERT(VARCHAR(50),ST.object_id)	        AS DatabaseObjectId
        ,LTRIM(RTRIM(ST.[name]))                    AS DatabaseObjectName
        ,SS.[name]                                  AS DatabaseObjectSchemaName
        ,'[' + SS.[name] + '].[' + LTRIM(RTRIM(ST.[name])) + ']'  AS FullyQualifiedDatabaseObjectName
      FROM [sys].[tables] as ST
      INNER JOIN [sys].[schemas] AS SS
      ON SS.schema_id = ST.schema_id
      ORDER BY SS.[name] ASC
              ,QUOTENAME(LTRIM(RTRIM(UPPER(ST.[name])))) ASC
    `;

    // generate the fully formatted sql statement:
    this._mySqlHelper.BuildSqlStatement(ObjectName, sqlString, true, 'TABLES', 'TABLE');

    // execute the sql statement:
    execReturnValue = this._mySqlHelper.ExecuteQuery();
    return execReturnValue;
  }

  public ExpandViewsFolder(ObjectName: string): any
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    var execReturnValue: any;
    var sqlString: string;

    // setup our query string:
    sqlString = `
      SELECT
         CONVERT(VARCHAR(50),SV.object_id)         AS DatabaseObjectObjectId
        ,LTRIM(RTRIM(SV.[name]))                   AS DatabaseObjectName
        ,SS.[name]                                 AS DatabaseObjectSchemaName
        ,'[' + SS.[name] + '].[' + LTRIM(RTRIM(SV.[name])) + ']' AS FullyQualifiedDatabaseObjectName
      FROM [sys].[views] as SV
      INNER JOIN [sys].[schemas] AS SS
      ON SS.schema_id = SV.schema_id
      ORDER BY SS.[name] ASC
              ,QUOTENAME(LTRIM(RTRIM(UPPER(SV.[name])))) ASC
    `;

    // generate the fully formatted sql statement:
    this._mySqlHelper.BuildSqlStatement(ObjectName, sqlString, true, 'VIEWS', 'VIEW');

    // execute the sql statement:
    execReturnValue = this._mySqlHelper.ExecuteQuery();
    return execReturnValue;
  }

  public ExpandTable(DatabaseName: string, DatabaseSchema: string, TableName: string): any
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    var execReturnValue: any;
    var sqlString: string;

    // setup our query string:
    sqlString = `
        SELECT
          CONVERT(VARCHAR(50),ST.object_id)	        	AS DatabaseObjectId
          ,LTRIM(RTRIM(ST.[name]))		                AS DatabaseObjectName
          ,SS.[name]									                AS DatabaseObjectSchemaName
          ,'[' + SS.[name] + '].[' + ST.[name] + ']'	AS FullyQualifiedDatabaseObjectName
          ,CONVERT(VARCHAR(50),SC.column_id)			    AS DatabaseObjectColumnId
          ,LTRIM(RTRIM(SC.[name]))		                AS ColumnName
          ,LTRIM(RTRIM(UPPER(SST.[name])))            AS ColumnDataType
          ,ISNULL(SST.collation_name,'')					    AS ColumnCollationType
          ,LTRIM(RTRIM(SC.[name]))
                     + ' ('
                     + (CASE
                            WHEN SC.is_identity = 1
                            THEN 'PK, '
                            WHEN (SELECT
                                    CASE
                                      WHEN EXISTS(SELECT TOP 1 * FROM sys.foreign_key_columns WHERE parent_object_id = ST.object_id AND parent_column_id = SC.column_id)
                                      THEN 1
                                    ELSE 0
                                  END) = 1
                            THEN 'FK, '
                          ELSE ''
                        END)
                     + (CASE
                            WHEN SST.[name] IN ('decimal','float')
                            THEN SST.[name] + '(' + CONVERT(VARCHAR(10),SC.scale) + ',' + CONVERT(VARCHAR(10),SC.[precision]) + ')'
                            WHEN SST.[name] IN ('varchar','nvarchar','char','nchar', 'sysname')
                            THEN SST.[name] + '(' + CONVERT(VARCHAR(10),SST.[max_length]) + ')'
                          ELSE SST.[name]
                        END)
                     + ','
                     + (CASE SC.is_nullable
                            WHEN 1
                            THEN ' null'
                          ELSE ' not null'
                        END)
                     + ')'                            AS ColumnDisplayName
            ,SC.is_computed				                    AS ColumnIsComputed
      FROM [sys].[tables] as ST

      INNER JOIN [sys].[schemas] AS SS
      ON SS.schema_id = ST.schema_id

      INNER JOIN [sys].[columns] AS SC
      ON SC.object_id = ST.object_id

      INNER JOIN [sys].[types] AS SST
       ON SST.user_type_id = SC.user_type_id

      WHERE ST.[name] = '${ TableName }'
        AND SS.[name] = '${ DatabaseSchema }'
      ORDER BY SC.column_id ASC
    `;

    // generate the fully formatted sql statement:
    this._mySqlHelper.BuildSqlStatement(DatabaseName, sqlString, true, 'COLUMNS', 'COLUMN');

    // execute the sql statement:
    execReturnValue = this._mySqlHelper.ExecuteQuery();
    return execReturnValue;
  }

  public ExpandView(DatabaseName: string, DatabaseSchema: string, ViewName: string): any
  {
    let log = new GroovyLogger.GroovyConsoleLogger();
    var execReturnValue: any;
    var sqlString: string;

    // setup our query string:
    sqlString = `
        SELECT
          CONVERT(VARCHAR(50),SV.object_id)		        AS DatabaseObjectId
          ,LTRIM(RTRIM(SV.[name]))		                AS DatabaseObjectName
          ,SS.[name]									                AS DatabaseObjectSchemaName
          ,'[' + SS.[name] + '].[' + SV.[name] + ']'	AS FullyQualifiedDatabaseObjectName
          ,CONVERT(VARCHAR(50),SC.column_id)			    AS DatabaseObjectColumnId
          ,LTRIM(RTRIM(SC.[name]))		                AS ColumnName
          ,LTRIM(RTRIM(UPPER(SST.[name])))            AS ColumnDataType
          ,ISNULL(SST.collation_name,'')              AS ColumnCollationType
          ,LTRIM(RTRIM(SC.[name]))
                     + ' ('
                     + (CASE
                            WHEN SC.is_identity = 1
                            THEN 'PK, '
                            WHEN (SELECT
                                    CASE
                                      WHEN EXISTS(SELECT TOP 1 * FROM sys.foreign_key_columns WHERE parent_object_id = SV.object_id AND parent_column_id = SC.column_id)
                                      THEN 1
                                    ELSE 0
                                  END) = 1
                            THEN 'FK, '
                          ELSE ''
                        END)
                     + (CASE
                            WHEN SST.[name] IN ('decimal','float')
                            THEN SST.[name] + '(' + CONVERT(VARCHAR(10),SC.scale) + ',' + CONVERT(VARCHAR(10),SC.[precision]) + ')'
                            WHEN SST.[name] IN ('varchar','nvarchar','char','nchar', 'sysname')
                            THEN SST.[name] + '(' + CONVERT(VARCHAR(10),SST.[max_length]) + ')'
                          ELSE SST.[name]
                        END)
                     + ','
                     + (CASE SC.is_nullable
                            WHEN 1
                            THEN ' null'
                          ELSE ' not null'
                        END)
                     + ')'                           AS ColumnDisplayName
          ,SC.is_computed				                     AS ColumnIsComputed
      FROM [sys].[views] as SV

      INNER JOIN [sys].[schemas] AS SS
      ON SS.schema_id = SV.schema_id

      INNER JOIN [sys].[columns] AS SC
      ON SC.object_id = SV.object_id

      INNER JOIN [sys].[types] AS SST
       ON SST.user_type_id = SC.user_type_id

      WHERE SV.[name] = '${ ViewName }'
        AND SS.[name] = '${ DatabaseSchema }'
      ORDER BY SC.column_id ASC
    `;

    // generate the fully formatted sql statement:
    this._mySqlHelper.BuildSqlStatement(DatabaseName, sqlString, true, 'COLUMNS', 'COLUMN');

    // execute the sql statement:
    execReturnValue = this._mySqlHelper.ExecuteQuery();

    return execReturnValue;
  }

}
