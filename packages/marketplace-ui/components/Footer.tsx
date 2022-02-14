import { Text, Container, SimpleGrid, VStack } from "@chakra-ui/react";

const sections = [{
  name: "Docs",
  items: [{
    name: "tutorial",
    link: ""
  }]
}, {
    name: "Community",
    items: [{
      name: "Discord",
      link: ""
    }, {
      name: "Twitter",
      link: ""
    }]
  }, {
    name: "More",
    items: [{
      name: "Blog",
      link: ""
    }, {
      name: "GitHub",
      link: ""
    }]
  }]
export const Footer = () => {
  return <Container maxW="container.lg" padding="29px" backgroundColor="black.300">
    <SimpleGrid columns={[1, 3]}>
      {sections.map(({ name, items }) => {
      <VStack key={name}>
        <Text fontWeight={700} fontSize="15px" color="white">
          {name}
        </Text>
        <Text fontWeight={400} fontSize="15px" color="orange.500">
          {name}
        </Text>
      </VStack>;
      })}
    </SimpleGrid>
  </Container>;
}