import axios from "axios";

async function main() {
  const q = "Assassin's Creed Odyssey";
  const query = `
    query SearchCatalog($keyword: String!) {
      Catalog {
        searchStore(keyword: $keyword, category: "games/edition/base|bundles/games|games/edition/standalone", count: 10) {
          elements {
            id
            title
            keyImages {
              type
              url
            }
            price {
              totalPrice {
                originalPrice
                discountPrice
                fmtPrice {
                  originalPrice
                  discountPrice
                }
              }
            }
            urlSlug
          }
        }
      }
    }
  `;
  try {
    const res = await axios.post("https://store.epicgames.com/graphql", {
      query,
      variables: { keyword: q }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    if (e.response) {
       console.error("status:", e.response.status, "data:", e.response.data);
    } else {
       console.error(e.message);
    }
  }
}

main();
