import { BasicMenuAction } from "@/components/basic-menu-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { modifierForm } from "./sheet-modifier-form";
import { useMutationDeleteModifier } from "@/app/hooks/use-query-modifier";
import { toast } from "sonner";
import { Pagination } from "@/components/pagination";
import { bindProductModifier } from "./bind-product-modifier";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ProductModifierType } from "@/dataloader/product-variant-loader";

interface Props {
  data: ProductModifierType[];
  offset: number;
  total: number;
  onSuccess?: () => void;
}

export function ModifierList(props: Props) {
  const { trigger } = useMutationDeleteModifier();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifiers</CardTitle>
        <CardDescription>{props.total} modifiers found</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nowrap text-xs">Name</TableHead>
              <TableHead className="text-nowrap text-xs">Description</TableHead>
              <TableHead className="text-nowrap text-xs">Items</TableHead>
              <TableHead className="text-nowrap text-xs">Created At</TableHead>
              <TableHead className="text-nowrap text-xs">Created By</TableHead>
              <TableHead className="text-nowrap text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.data.map((x, i) => {
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {x.title}
                  </TableCell>
                  <TableCell className="font-medium text-nowrap text-xs">
                    {x.description}
                  </TableCell>
                  <TableCell className="text-nowrap text-xs">
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="text-nowrap text-xs">
                          {x.items?.length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {x.items?.map((item) => (
                          <div key={item.id} className="border-b-[0.5px]">
                            {item.name}
                          </div>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{x.createdAt}</TableCell>
                  <TableCell>{x.createdBy?.fullname}</TableCell>
                  <TableCell>
                    <BasicMenuAction
                      resource="modifier"
                      value={x}
                      onEdit={async () => {
                        const res = await modifierForm.show({
                          data: {
                            id: x.modifierId,
                            title: x.title,
                            description: x.description,
                            items: x.items
                              ? x.items?.map((x) => {
                                  return {
                                    id: x.id || "",
                                    name: x.name || "",
                                    price: Number(x.price || 0),
                                  };
                                })
                              : [],
                          },
                        });

                        if (!!res) {
                          props.onSuccess?.();
                        }
                      }}
                      onDelete={() => {
                        trigger({ id: x.modifierId || "" }).then((res) => {
                          if (res) {
                            toast.success("Modifier deleted successfully");
                            props.onSuccess?.();
                          } else {
                            toast.error("Failed to delete modifier");
                          }
                        });
                      }}
                      items={[
                        {
                          label: "Applies to Products",
                          onClick: () => {
                            bindProductModifier.show({ id: x.modifierId });
                          },
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Pagination
          offset={props.offset}
          totalPerPage={props.data.length || 0}
          limit={30}
          total={props.total}
          text="Modifier"
        />
      </CardFooter>
    </Card>
  );
}
