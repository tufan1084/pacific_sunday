declare module 'country-list' {
  export interface Country {
    code: string;
    name: string;
  }

  export function getData(): Country[];
  export function getCode(name: string): string | undefined;
  export function getName(code: string): string | undefined;
}
