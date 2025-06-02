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
import { ChangeEventHandler, Dispatch, SetStateAction } from "react";

const useModal = (
  inputs: {
    label: string;
    value: string | number | Date | null;
    type?: string,
    onChange?: ChangeEventHandler;
  }[] = [
    {
      label: "Title",
      value: "Title",
      type: "text"
    },
  ],
  actions = [
    {
      label: "Close",
      handler: (_e: PressEvent, onClose: () => void) => onClose(),
    },
  ]
) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const modal = (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose: () => void) => (
          <>
            <ModalHeader>Edit Title</ModalHeader>

            <ModalBody>
              {inputs.map((input, i) => (
                <Input
                  key={i}
                  value={input.value !== null ? input.value.toString() : ""}
                  type={typeof input.value}
                  onChange={input.onChange}
                  placeholder={input.label}
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
