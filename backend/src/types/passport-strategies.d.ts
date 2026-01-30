declare module 'passport-gitlab2' {
  import { Strategy as PassportStrategy } from 'passport';
  export class Strategy extends PassportStrategy {
    constructor(options: any, verify: any);
  }
}

declare module 'passport-linkedin-oauth2' {
  import { Strategy as PassportStrategy } from 'passport';
  export class Strategy extends PassportStrategy {
    constructor(options: any, verify: any);
  }
}
