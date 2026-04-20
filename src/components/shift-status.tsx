import {
  AlertCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  StopCircleIcon,
} from "lucide-react";
import { useAuthentication } from "../../contexts/authentication-context";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import moment from "moment-timezone";

interface Props {
  onOpen: () => void;
  onClose: () => void;
}

export function ShiftStatus(props: Props) {
  const { currentShift } = useAuthentication();

  if (currentShift) {
    return (
      <div className="ml-4 flex items-center gap-2">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircleIcon className="mr-1 h-3 w-3" />
          Shift Active
        </Badge>
        <span className="text-sm text-muted-foreground hidden md:inline">
          • Started {moment(new Date(currentShift.opened_at + "")).fromNow()}
        </span>
        <Button size="sm" variant="outline" onClick={props.onClose}>
          <StopCircleIcon className="mr-1 h-3 w-3" />
          End Shift
        </Button>
      </div>
    );
  }

  return (
    <div className="ml-4 flex items-center gap-2">
      <Badge
        variant="destructive"
        className="bg-red-100 text-red-800 hover:bg-red-100"
      >
        <AlertCircleIcon className="mr-1 h-3 w-3" />
        No Active Shift
      </Badge>
      <Button size="sm" variant="outline" onClick={props.onOpen}>
        <PlayIcon className="mr-1 h-3 w-3" />
        Start Shift
      </Button>
    </div>
  );
}
