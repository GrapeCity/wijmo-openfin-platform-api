import { Pipe, NgModule } from '@angular/core';

import * as wjcCore from '@grapecity/wijmo';

@Pipe({
    name: 'glbz',
    // stateful pipe
    pure: false
})
export class GlbzPipe {
    transform(value: any, args: string[]): any {
        return wjcCore.Globalize.format(value, args[0]);
    }
}
