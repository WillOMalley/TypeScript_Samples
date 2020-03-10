"Use Strict";

import * as styles from './ProgressSpinner.module.scss';

export class ProgressSpinner
{
  //#region Private Variables:
  private _progressSpinnerHomeContainer: HTMLElement;
  private _progressSpinnerBodyContainer: HTMLElement;
  private _progressSpinnerLoader: HTMLElement;
  private _progressSpinnerMessageContainer: HTMLElement;

  //#endregion

  //#region Public Properties:

  //#endregion

  //#region Public Methods:

  constructor()
  {

  }

/**
 * Call this method to generate the HTML for the Progress Spinner
 *
 * @param {HTMLElement} SpinnerHomeContainer -- The initial parent element
 * @returns {string} -- HTML String
 * @memberof ProgressSpinner
 */
public render(SpinnerHomeContainer: HTMLElement): string
  {
    var innerHTML = '';

    this._progressSpinnerHomeContainer = SpinnerHomeContainer;

    innerHTML = `
      <TABLE ID="tblProgressSpinner" class="${ styles.default.ProgressSpinner}" CELLPADDING="0" CELLSPACING="0" BORDER="0">
        <TR>
          <TD>
            <DIV ID="dvProgressLoader" class="${ styles.default.loader}"></DIV>
            <DIV ID="dvProgressMessage" class="${ styles.default.LoaderMessage}">
            </DIV>
          </TD>
        </TR>
      </TABLE>
    `;

    this.InitializeComponent();

    return innerHTML;
  }

  //#endregion

  //#region Private Methods:

  private InitializeComponent(): void
  {
    this._progressSpinnerBodyContainer = document.getElementById("tblProgressSpinner");
    this._progressSpinnerLoader = document.getElementById("dvProgressLoader");
    this._progressSpinnerMessageContainer = document.getElementById("dvProgressMessage");
  }

  //#endregion

  //#region Public Methods

  public SetProgressSpinnerPosition(Target: HTMLElement): void
  {
    var LoadingAnimationTotalWidth: number = Math.ceil(Target.offsetParent.clientWidth) - 7;
    var LoadingAnimationTotalHeight: number = Math.ceil(Target.offsetParent.clientHeight) + 5;

    // Set the Loading Animation Position:
    this._progressSpinnerBodyContainer.style.top = "0px";
    this._progressSpinnerBodyContainer.style.left = "0px";
    this._progressSpinnerBodyContainer.style.width = LoadingAnimationTotalWidth + "px";
    this._progressSpinnerBodyContainer.style.height = LoadingAnimationTotalHeight + "px";

    // Set the Message Position:
    this._progressSpinnerMessageContainer.style.top = Math.ceil(LoadingAnimationTotalHeight / 2) - 5 + "px";
    this._progressSpinnerMessageContainer.style.left = Math.ceil(LoadingAnimationTotalWidth / 2) - 5 + "px";

    // Now move the Loading Animation to the Target HTMLElement:
    Target.offsetParent.appendChild(this._progressSpinnerBodyContainer);
  }

  public ShowProgressSpinner(): void
  {
    this._progressSpinnerBodyContainer.style.display = "block";
  }

  public SendProgressSpinnerMessage(message: string): void
  {
    // Set our message:
    this._progressSpinnerMessageContainer.innerHTML = `
    <SPAN STYLE="width: 100%, height: 100%; align-items: center; vertical-align: middle; ">
      ${ message }
    </SPAN>
    `;
  }

  public HideProgressSpinner(Target: HTMLElement): void
  {
    // Get a reference to the Parent Element:
    let ParentElement: Element = Target.offsetParent;

    // Remove the Progress Spinner:
    for (var item in ParentElement.children)
    {
      if (ParentElement.children[item] == this._progressSpinnerBodyContainer)
      {
        ParentElement.removeChild(this._progressSpinnerBodyContainer);
      }
    }

    // Move back to the element of origin:
    this._progressSpinnerHomeContainer.appendChild(this._progressSpinnerBodyContainer);

    // House Cleaning:
    this._progressSpinnerMessageContainer.innerHTML = "";
    this._progressSpinnerBodyContainer.style.top = "0px";
    this._progressSpinnerBodyContainer.style.left = "0px";
    this._progressSpinnerBodyContainer.style.display = "none";
  }

  //#endregion
}
