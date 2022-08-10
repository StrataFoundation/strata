import { Box, Icon, Input, InputGroup, InputLeftElement, VStack } from "@chakra-ui/react";
import React, { useContext, useMemo, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import {
  Grid, // our UI Component to display the results
  SearchBar, // the search bar the user will type into
  SearchContext, // the context that wraps and connects our components
  SearchContextManager, // the context manager, includes the Context.Provider
  SuggestionBar, // an optional UI component that displays trending searches and channel / username results
} from "@giphy/react-components";
import { GIPHY_API_KEY } from "../constants/globals";


export function GifSearch({ onSelect }: { onSelect: (gifyId: string) => void }) {
  return (
    <SearchContextManager apiKey={GIPHY_API_KEY}>
      <Components onSelect={onSelect} />
    </SearchContextManager>
  );
}

// define the components in a separate function so we can
// use the context hook. You could also use the render props pattern
const Components = ({ onSelect }: { onSelect: (gifyId: string) => void }) => {
  //@ts-ignore
  const { fetchGifs, searchKey } = useContext(SearchContext);
  return (
    <>
      <SearchBar />
      <Box w="full" mt={2}>
        <SuggestionBar />
      </Box>
      {/** 
                key will recreate the component, 
                this is important for when you change fetchGifs 
                e.g. changing from search term dogs to cats or type gifs to stickers
                you want to restart the gifs from the beginning and changing a component's key does that 
            **/}
      <Box maxH="500px" overflow="auto" mt={4}>
        {/* @ts-ignore */}
        <Grid
          key={searchKey}
          columns={3}
          width={625}
          fetchGifs={fetchGifs}
          onGifClick={(gif, e) => {
            e.preventDefault();
            onSelect(String(gif.id));
          }}
        />
      </Box>
    </>
  );
};