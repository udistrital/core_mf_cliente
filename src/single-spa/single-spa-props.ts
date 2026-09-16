import { ReplaySubject } from 'rxjs';
import { AppProps } from 'single-spa';
import { CoreEnvironment } from '../app/models/core-environment';

export const singleSpaPropsSubject = new ReplaySubject<SingleSpaProps>(1);

// Add any custom single-spa props you have to this type def
// https://single-spa.js.org/docs/building-applications.html#custom-props
export type SingleSpaProps = AppProps & {
  environment?: Partial<CoreEnvironment>;
};
