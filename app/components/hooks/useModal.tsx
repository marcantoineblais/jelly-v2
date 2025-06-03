import {
  Button,
  input,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  PressEvent,
  useDisclosure,
} from "@heroui/react";
import { ChangeEventHandler, ReactNode } from "react";

const useModal = (
  inputs: {
    label: string;
    value: string | number | Date | null;
    type?: string;
    onChange?: ChangeEventHandler;
  }[] = [
    {
      label: "Title",
      value: "Title",
      type: "text",
    },
  ],
  actions = [
    {
      label: "Close",
      handler: (_e: PressEvent, onClose: () => void) => onClose(),
    },
  ],
  header: ReactNode = "Edit"
) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const modal = (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose: () => void) => (
          <>
            <ModalHeader>{header}</ModalHeader>
            <ModalBody>
              {inputs.map((input, i) => (
                <Input
                  key={i}
                  label={input.label}
                  value={input.value !== null ? input.value.toString() : ""}
                  type={input.type}
                  onChange={input.onChange}
                  radius="sm"
                  classNames={{label: "group-data-[filled-within=true]:-translate-y-[75%]", input: "focus:outline-none"}}
                />
              ))}
            </ModalBody>

            <ModalFooter>
              {actions.map((action, i) => (
                <Button key={i} onPress={(e) => action.handler(e, onClose)}>
                  {action.label}
                </Button>
              ))}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );

  return { onOpen, modal };
};

export default useModal;
