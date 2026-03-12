// Stocke le ConfirmationResult natif entre LoginScreen et OTPScreen
// (non sérialisable, donc ne peut pas passer par les params de navigation)
let _confirmationResult: any = null;

export function setConfirmationResult(result: any) {
  _confirmationResult = result;
}

export function getConfirmationResult(): any {
  return _confirmationResult;
}

export function clearConfirmationResult() {
  _confirmationResult = null;
}
