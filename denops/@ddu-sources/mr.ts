import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v0.1.0/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v0.1.0/deps.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.1.0/file.ts#^";
import {
  ensureArray,
  isString,
} from "https://deno.land/x/unknownutil@v1.1.4/mod.ts";

const kinds = ["mrr", "mrw", "mru"];

type Params = {
  kind: string;
};

export class Source extends BaseSource<Params> {
  kind = "file";

  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const idx = kinds.indexOf(args.sourceParams.kind);
        const result = await args.denops.call(`mr#${kinds.at(idx)}#list`);
        ensureArray(result, isString);
        controller.enqueue(result.map((p) => ({
          word: p,
          action: {
            path: p,
          },
        })));
        controller.close();
      },
    });
  }

  params(): Params {
    return {
      kind: "mru",
    };
  }
}
