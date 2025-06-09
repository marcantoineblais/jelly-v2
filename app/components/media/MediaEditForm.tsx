"use client"

import { MediaFile } from "@/app/types/MediaFile"
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { useEffect, useState } from "react";

const MediaEditForm = ({ files }: { files: MediaFile[]}) => {
  const [defaultTitle, setDefaultTitle] = useState<string>("");
  const [defaultSeason, setDefaultSeason] = useState<number | null>(null);
  const [defaultEpisode, setDefaultEpisode] = useState<number | null>(null);
  const [defaultType, setDefaultType] = useState<string>("");
  
  const [updatedTitle, setUpdatedTitle] = useState<string>("");
  const [updatedSeason, setUpdatedSeason] = useState<number | null>(null);
  const [updatedEpisode, setUpdatedEpisode] = useState<number | null>(null);
  const [updatedType, setUpdatedType] = useState<string>("");
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  
  function saveMediaInfo() {
    files.forEach((file) => {
      if (!file.mediaInfo) {
        file.mediaInfo = {};
      }

      file.mediaInfo.title = updatedTitle;
      file.mediaInfo.season = updatedSeason;
    });
  }

  return (
    
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose: () => void) => {
              const saveChanges = () => {
                saveMediaInfo();
                onClose();
              };

              return (
                <>
                  <ModalHeader>Edit selected files</ModalHeader>
                  <ModalBody>
                    <Input
                      label="Title"
                      defaultValue={defaultTitle}
                      value={updatedTitle}
                      type="text"
                      onValueChange={setUpdatedTitle}
                      radius="sm"
                      classNames={{
                        label:
                          "group-data-[filled-within=true]:-translate-y-[75%]",
                        input: "focus:outline-none",
                      }}
                    />

                    <Input
                      label="Season"
                      defaultValue={defaultSeason?.toString()}
                      value={updatedSeason?.toString()}
                      type="number"
                      onChange={(e) => {
                        const number = e.currentTarget.value
                          ? parseInt(e.currentTarget.value)
                          : null;
                        setUpdatedSeason(number);
                      }}
                      radius="sm"
                      classNames={{
                        label:
                          "group-data-[filled-within=true]:-translate-y-[75%]",
                        input: "focus:outline-none",
                      }}
                    />
                    
                    <Input
                      label="Episode"
                      defaultValue={defaultEpisode?.toString()}
                      value={updatedEpisode?.toString()}
                      type="number"
                      onChange={(e) => {
                        const number = e.currentTarget.value
                          ? parseInt(e.currentTarget.value)
                          : null;
                        setUpdatedEpisode(number);
                      }}
                      radius="sm"
                      classNames={{
                        label:
                          "group-data-[filled-within=true]:-translate-y-[75%]",
                        input: "focus:outline-none",
                      }}
                    />

                    <Input
                      label="Type"
                      defaultValue={defaultType}
                      value={updatedType}
                      type="text"
                      onValueChange={setUpdatedType}
                      radius="sm"
                      classNames={{
                        label: "group-data-[filled-within=true]:-translate-y-[75%]",
                        input: "focus:outline-none",
                      }}
                    />
                  </ModalBody>

                  <ModalFooter>
                    <Button onPress={onClose}>Cancel</Button>
                    <Button onPress={saveChanges}>Save</Button>
                  </ModalFooter>
                </>
              );
            }}
          </ModalContent>
        </Modal>
  )
}

export default MediaEditForm;