"Use Strict";

/**
 * Use this enum to set the type of message you are logging.
 * Each message type has it's own font color.
 * Error = Red, Warning = Yellow and Info = Green
 *
 * @export
 * @enum {number}
 */
export enum MessageType
{
   ErrorMsg = "Error"
  ,WarningMsg = "Warning"
  ,InfoOnlyMsg = "Info"
}

/**
 * Use this enum to set the type of error you're logging.
 * The value chosen will show in the debug message but it's not use
 * for any font coloring or styling.
 * @export
 * @enum {number}
 */
export enum ErrorType
{
   TypeError = "TypeError"
  ,RangeError = "RangeError"
  ,EvalError = "EvalError"
  ,ReferenceError = "ReferenceError"
  ,SyntaxError = "SyntaxError"
  ,NonError = "String"
  ,GenericError = "Error"
}
/**
 * Console Color constants:
 * Reference: http://voidcanvas.com/make-console-log-output-colorful-and-stylish-in-browser-node/
 *
 * @enum {number}
 */
const enum ForgroundColorConstants
{
  FgBlack = "\x1b[30m"
  ,FgRed = "\x1b[31m"
  ,FgGreen = "\x1b[32m"
  ,FgYellow = "\x1b[33m"
  ,FgBlue = "\x1b[34m"
  ,FgMagenta = "\x1b[35m"
  ,FgCyan = "\x1b[36m"
  ,FgWhite = "\x1b[37m"
}


export class GroovyConsoleLogger
{
  // Private Variables

  private _dDate: string = Date().toString();
  private _ParameterList: [string, any][] = [];
  private _File: string;
  private _Method: string;
  private _MethodLineRange: string;
  private _ConsoleLineList: Array<string> = [];
  private _NewLine: any = RegExp('/\r\n/g');

  // Begin Public Properties:

  public get Method(): string
  {
    return this._Method;
  }

  public set Method(value: string)
  {
    this._Method = value;
  }

  public get File(): string
  {
    return this._File;
  }

  public set File(value: string)
  {
    this._File = value;
  }

  public get MethodLineRange(): string
  {
    return this._MethodLineRange;
  }

  public set MethodLineRange(value: string)
  {
    this._MethodLineRange = value;
  }

  // End Properties

  // Public Methods:

  public AddParameterToParameterList(ParameterName: string, ParameterValue: any): void
  {
    this._ParameterList.push([ParameterName, ParameterValue]);
  }

/**
 * Use this method to add information to the console.
 * The Log
 *
 * @param {MessageType} LogMessageType
 * This is the Type of message you would like to append.

 * @param {ErrorType} LogErrorType
 * This is the Type of error.
 *
 * @param {*} LogMessage
 * This is the Object you would like to append.
 * This can be a custom string or an Error object.
 *
 * @param {string} LogErrorLineRange
 * This is the Line range for the error you are trying to trap.
 * When you have multiple try/catch blocks in the same Method. This will help to tell you exactly which
 * try/catch block is failing.
 *
 * @memberof GroovyConsoleLogger
 */
  public AppendLogMessage(LogMessageType: MessageType, LogErrorType: ErrorType, LogMessage: any, LogErrorLineRange: string)
  {

    switch (LogMessageType)
    {
      case MessageType.ErrorMsg:
        {
          var myError: Error = LogMessage as Error;

          this.AppendErrorMessage(LogErrorType, myError, LogErrorLineRange);

          break;
        }
      case MessageType.WarningMsg:
        {
          var myWarningMessage: string = LogMessage as string;

          this.AppendWarningMessage(myWarningMessage, LogErrorLineRange);

          break;
        }
      case MessageType.InfoOnlyMsg:
        {
          var myInfoMessage: string = LogMessage as string;

          this.AppendInformationalMessage(myInfoMessage, LogErrorLineRange);

          break;
        }
    }

  }

/**
 * Use this method to generate the Log Header.
 * Make sure you have set all Properties before calling this.
 * Also, if you have Parameters you would like to show up in the log.
 * You will need to add those by calling AddParameterToParameterList before calling this method.
 *
 * @memberof GroovyConsoleLogger
 */
  public BuildMessageHeader(): void
  {
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "******************************************************************************************");
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* Date Time: " + ForgroundColorConstants.FgBlue + this._dDate);
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* File: " + ForgroundColorConstants.FgBlue + this._File);
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* Method: " + ForgroundColorConstants.FgMagenta + this._Method);
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* Method Line Range: (" + ForgroundColorConstants.FgWhite + this._MethodLineRange + ForgroundColorConstants.FgGreen + ")");

    // Add section seperator:
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '*-----------------------------------------------------------------------------------------');
  }

  public BuildMessageFooter(): void
  {
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "******************************************************************************************");
  }

  public GenerateLog(ClearConsole:boolean): void
  {
    if (ClearConsole)
    {
      console.clear();
    }
    // Output any parameters:
    if (this._ParameterList.length > 0)
    {
      // Add section seperator:
      this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* Parameter section: ");

      this._ParameterList.forEach((item) =>
      {
        this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* @Parameter: ' +
          ForgroundColorConstants.FgWhite + '[' + item[0].toString() + ']' +
          ForgroundColorConstants.FgGreen + ' @Value: ' +
          ForgroundColorConstants.FgWhite + '[' + item[1].toString() + ']'
        );
      });

      // Add section seperator:
      this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '*-----------------------------------------------------------------------------------------');
    }

    // Now output all the Log messages that have been appended:
    this._ConsoleLineList.forEach((value: string) => {
      console.log(value.trim());
    });

    this.Dispose();
  }

  // End Public Methods


  // Private Methods:

  private AppendErrorMessage(LogErrorType: ErrorType, LogMessage: any, LogErrorLineRange: string): void
  {

    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* ' + ForgroundColorConstants.FgRed + 'Error Message: ');
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* Error Type: ' + ForgroundColorConstants.FgRed + LogErrorType );
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* Line Range: (" + ForgroundColorConstants.FgWhite + LogErrorLineRange + ForgroundColorConstants.FgGreen + ")");

    if (LogMessage instanceof String)
    {
      var messageLines: Array<string> = [];
      var message: string = <string>LogMessage;

      if (message.indexOf(this._NewLine.toString()) > 0)
      {
        messageLines = message.split(this._NewLine.toString());
        messageLines.forEach((value: string) =>
        {
          this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '*  ' + ForgroundColorConstants.FgRed + value);
        });
      }
      else
      {
        this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* ' + ForgroundColorConstants.FgRed + message);
      }
    }
    else if (LogMessage instanceof Error)
    {
      let err = <Error>LogMessage;
      this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* Error Name: ' + ForgroundColorConstants.FgRed + err.name);
      this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* Error Message: ' + ForgroundColorConstants.FgRed + err.message);
      this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* Error Stack: ' + ForgroundColorConstants.FgRed + err.stack);
    }
  }

  private AppendWarningMessage(LogMessage: any, LogErrorLineRange: string): void
  {
    var messageLines: Array<string> = [];
    var message: string = <string>LogMessage;

    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* ' + ForgroundColorConstants.FgYellow + ' Warning Message: ');
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* Line Range: (" + ForgroundColorConstants.FgWhite + LogErrorLineRange + ForgroundColorConstants.FgGreen + ")");

    if (message.indexOf(this._NewLine.toString()) > 0)
    {
      messageLines = message.split(this._NewLine.toString());
      messageLines.forEach((value: string) => {
        this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '*  ' + ForgroundColorConstants.FgYellow +  value);
      });
    }
    else
    {
      this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* ' + ForgroundColorConstants.FgYellow + message);
    }
  }

  private AppendInformationalMessage(LogMessage: any, LogErrorLineRange: string): void
  {
    var messageLines: Array<string> = [];
    var message: string = <string>LogMessage;

    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* ' + ForgroundColorConstants.FgGreen + ' Informational Message: ');
    this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + "* Line Range: (" + ForgroundColorConstants.FgWhite + LogErrorLineRange + ForgroundColorConstants.FgGreen + ")");

    if (message.indexOf(this._NewLine.toString()) > 0)
    {
        messageLines = message.split(this._NewLine.toString());
        messageLines.forEach((value: string) => {
        this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* ' + value);
      });
    }
    else
    {
      this._ConsoleLineList.push(ForgroundColorConstants.FgGreen + '* ' + message);
    }

  }

  private Dispose(): void
  {
    this._ParameterList = [];
    this._File = "";
    this._MethodLineRange = "";
    this._Method = "";
    this._ConsoleLineList = [];
  }

  // End Private Methods
}
