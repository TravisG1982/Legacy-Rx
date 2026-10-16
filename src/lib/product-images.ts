import type { MedKey } from "./legacyrx-data";
import semaVial from "../assets/semaglutide-vial.webp.asset.json";
import tirzVial from "../assets/tirzepatide-vial.webp.asset.json";
import trtInj from "../assets/products/trt_inj.jpg";
import trtCream from "../assets/products/trt_cream.jpg";
import enclo from "../assets/products/enclo.jpg";
import estradiol from "../assets/products/estradiol.jpg";
import nad from "../assets/products/nad.jpg";
import sermorelin from "../assets/products/sermorelin.jpg";
import skinCream from "../assets/products/skin_cream.jpg";
import sildenafil from "../assets/products/sildenafil.jpg";
import tadalafil from "../assets/products/tadalafil.jpg";

/** Labeled product photo for each medication. */
export const PRODUCT_IMAGES: Record<MedKey, string> = {
  sema: semaVial.url,
  tirz: tirzVial.url,
  trt_inj: trtInj,
  trt_cream: trtCream,
  enclo,
  estradiol,
  nad,
  sermorelin,
  skin_cream: skinCream,
  sildenafil,
  tadalafil,
};
