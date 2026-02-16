// Model for rresponses from AI API

export interface ErrorResponse {
  errorType: string;      
  errorInCode: string;   
  whatWentWrong: string;  
  hintToFix: string;       
}
