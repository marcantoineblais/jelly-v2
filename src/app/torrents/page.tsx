"use client";

import { startTransition, useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  addToast,
  useDisclosure,
} from "@heroui/react";
import type {
  JackettIndexer,
  TorznabCategory,
} from "@/src/libs/torrents/jackett";
import { SortBy, type FeedItem } from "@/src/libs/torrents/feed-format";
import useFetch from "../../hooks/use-fetch";
import { JackettIndexerResponse } from "../api/torrents/indexers/route";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import { FeedResponse } from "../api/torrents/feed/route";
import { CapsResponse } from "../api/torrents/caps/route";
import {
  Accordion,
  AccordionButton,
  useAccordion,
} from "@/src/components/accordion";
import Table from "@/src/components/table/table";
import TableItem from "@/src/components/table/feed-table-item";

type FormData = {
  title: string;
  indexer: string;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  category: string;
  limit: number;
};

export default function TorrentsPage() {
  const { fetchData } = useFetch();
  const { isOpen, toggle } = useAccordion();
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();

  // Form states
  const [formData, setFormData] = useState<FormData>({
    title: "",
    indexer: "",
    sortBy: "date",
    sortOrder: "desc",
    category: "",
    limit: NaN,
  });

  // Data states
  const [items, setItems] = useState<FeedItem[]>([]);
  const [indexers, setIndexers] = useState<JackettIndexer[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isAddingToQbittorrent, setIsAddingToQbittorrent] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [categories, setCategories] = useState<TorznabCategory[]>([]);

  useEffect(() => {
    const fetchIndexers = async () => {
      try {
        const { data } = await fetchData<JackettIndexerResponse>(
          "/api/torrents/indexers",
          {
            setIsLoading: setIsPageLoading,
          },
        );
        setIndexers(data.indexers);
      } catch {
        setIndexers([]);
      }
    };

    fetchIndexers();
  }, [fetchData]);

  useEffect(() => {
    if (!formData.indexer) {
      startTransition(() => {
        setCategories([]);
        setFormData((prev) => ({ ...prev, category: "", limit: NaN }));
      });
      return;
    }

    const fetchCategories = async () => {
      try {
        const url = `/api/torrents/caps?indexer=${encodeURIComponent(formData.indexer)}`;
        const { data } = await fetchData<CapsResponse>(url);
        startTransition(() => {
          setCategories(data.caps.categories);
          setFormData((prev) => ({
            ...prev,
            limit: data.caps.limits?.max ?? NaN,
          }));
        });
      } catch {
        startTransition(() => setCategories([]));
      }
    };

    fetchCategories();
  }, [fetchData, formData.indexer]);

  function handleSelectItem(item: FeedItem) {
    setSelectedItem(item);
    onModalOpen();
  }

  function handleCloseModal() {
    onModalClose();

    setTimeout(() => {
      setSelectedItem(null);
    }, 200);
  }

  function handleInputFocus() {
    if (!isOpen) toggle();
  }

  async function addToQbittorrent(item: FeedItem) {
    if (!item.url) {
      addToast({
        title: "No link",
        description: "This item has no magnet or torrent link to add.",
        severity: "warning",
      });
      return;
    }
    const body = { url: item.url };
    try {
      await fetchData<QbittorrentResponse>("/api/qbit/torrents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        setIsLoading: setIsAddingToQbittorrent,
      });

      addToast({
        title: "Added to qBittorrent",
        description: item.title,
        severity: "success",
      });
    } catch (e) {
      addToast({
        title: "Add failed",
        description: e instanceof Error ? e.message : "Network error",
        severity: "danger",
      });
    }

    handleCloseModal();
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const { title, indexer, sortBy, sortOrder, category, limit } = formData;

    if (!title.trim()) {
      addToast({
        title: "Title is required",
        description: "Please enter a title to search for torrents.",
        severity: "warning",
      });
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        name: title.trim(),
        indexers: indexer,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      if (category) searchParams.set("category", category);
      if (Number.isFinite(limit) && limit > 0)
        searchParams.set("limit", String(limit));
      const { data } = await fetchData<FeedResponse>(
        `/api/torrents/feed?${searchParams.toString()}`,
        { setIsLoading: setIsSearchLoading },
      );
      setItems(
        data.items.map((item) => ({ ...item, isAddingToQbittorrent: false })),
      );
      if (isOpen) toggle();
    } catch {
      setItems([]);
    }

    setHasSearched(true);
  }

  return (
    <>
      <main className="h-full w-full flex flex-col gap-4 bg-stone-100 p-4 pb-8 overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 p-3 bg-white/80 rounded-lg border border-stone-200"
        >
          {/* Title input */}
          <div>
            <Input
              type="text"
              label="Title"
              aria-labelledby="Search by title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              autoComplete="off"
              onFocus={handleInputFocus}
            />
          </div>

          {/* Accordion */}
          <Accordion isOpen={isOpen}>
            <div className="flex flex-col gap-2">
              {/* Indexers select */}
              <div>
                <Select
                  items={indexers}
                  aria-labelledby="Indexers selection"
                  label="Indexers"
                  placeholder="All indexers"
                  selectionMode="single"
                  selectedKeys={[formData.indexer]}
                  onSelectionChange={(selection) =>
                    setFormData({
                      ...formData,
                      indexer: [...selection][0]?.toString() ?? "",
                    })
                  }
                >
                  {(indexer) => (
                    <SelectItem key={indexer.id}>{indexer.name}</SelectItem>
                  )}
                </Select>
              </div>

              {/* Sort by select */}
              <div className="flex gap-2">
                <Select
                  className="basis-3/5"
                  label="Sort by"
                  selectedKeys={[formData.sortBy]}
                  selectionMode="single"
                  onSelectionChange={(selection) =>
                    setFormData((prev) => {
                      const sortBy = Array.from(selection)[0];
                      if (!sortBy) return prev;
                      return { ...prev, sortBy: sortBy as SortBy };
                    })
                  }
                >
                  <SelectItem key="date">Date</SelectItem>
                  <SelectItem key="seeds">Seeds</SelectItem>
                  <SelectItem key="size">Size</SelectItem>
                </Select>
                <Select
                  className="basis-2/5"
                  label="Order"
                  selectionMode="single"
                  selectedKeys={[formData.sortOrder]}
                  onSelectionChange={(selection) =>
                    setFormData((prev) => {
                      const sortOrder = Array.from(selection)[0];
                      if (!sortOrder) return prev;
                      return {
                        ...prev,
                        sortOrder: sortOrder as "asc" | "desc",
                      };
                    })
                  }
                >
                  <SelectItem key="asc">Ascending</SelectItem>
                  <SelectItem key="desc">Descending</SelectItem>
                </Select>
              </div>

              {/* Category select */}
              {categories.length > 0 && (
                <div>
                  <Select
                    label="Category"
                    items={categories}
                    selectionMode="single"
                    selectedKeys={[formData.category]}
                    onSelectionChange={(selection) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: [...selection][0]?.toString() ?? "",
                      }))
                    }
                  >
                    {(category) => (
                      <SelectItem key={category.id}>{category.name}</SelectItem>
                    )}
                  </Select>
                </div>
              )}
            </div>
          </Accordion>

          {/* Search button */}
          <div className="flex w-full justify-center gap-2">
            <Button
              type="submit"
              color="primary"
              isLoading={isSearchLoading}
              disabled={isPageLoading}
            >
              Search
            </Button>

            {/* Accordion button */}
            <AccordionButton isOpen={isOpen} onToggle={toggle} />
          </div>
        </form>

        {hasSearched && (
          <Table items={items}>
            {(item) => (
              <TableItem
                key={item.id}
                item={item}
                onClick={() => handleSelectItem(item)}
              />
            )}
          </Table>
        )}

        <Modal
          isOpen={isModalOpen}
          onOpenChange={onModalOpenChange}
          placement="center"
          scrollBehavior="inside"
          onClose={handleCloseModal}
        >
          {selectedItem && (
            <ModalContent>
              <ModalHeader>Details</ModalHeader>
              <ModalBody>
                <div className="w-full">
                  <p className="break-all">{selectedItem.title}</p>
                  <div className="mt-4">
                    <p>Size: {selectedItem.size}</p>
                    <p>Seeds: {selectedItem.seeds}</p>
                    <p>Leech: {selectedItem.leech}</p>
                    <p>Published: {selectedItem.pubDate}</p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-center gap-2">
                <Button
                  color="default"
                  variant="ghost"
                  onPress={handleCloseModal}
                >
                  Close
                </Button>
                <Button
                  color="primary"
                  variant="ghost"
                  onPress={() => addToQbittorrent(selectedItem)}
                  isLoading={isAddingToQbittorrent}
                >
                  Add to qBittorrent
                </Button>
              </ModalFooter>
            </ModalContent>
          )}
        </Modal>
      </main>
    </>
  );
}
